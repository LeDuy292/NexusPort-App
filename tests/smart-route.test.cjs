const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/loadTypeScript.cjs");
const user = { id: "login-id", username: "driver", role: "Driver", isActive: true, token: "session-jwt" };

test("Smart Route uses Node Core, the signed-in JWT and an explicit booking scope", async () => {
  const route = { bookingId: "booking-2", containerId: "container-1" };
  const harness = createHarness(async () => new Response(JSON.stringify({ success: true, data: route }), { status: 200 }));
  harness.values.set("user", JSON.stringify(user));
  harness.values.set("node_core_base_url", "http://192.168.1.50:4000/api/v1/");
  const service = harness.load("src/features/driver/services/smartRouteService.ts");
  const result = await service.getSmartRoute("container-1", "booking-2");
  assert.equal(result.bookingId, "booking-2");
  assert.equal(harness.requests[0].url, "http://192.168.1.50:4000/api/v1/drivers/me/routes/container-1?bookingId=booking-2");
  assert.equal(harness.requests[0].options.headers.get("Authorization"), "Bearer session-jwt");
  assert.equal(harness.requests[0].options.baseUrl, undefined);
});

test("same container in another gate visit never replaces the requested booking", () => {
  const service = createHarness(() => {}).load("src/features/driver/services/smartRouteService.ts");
  const routes = [{ bookingId: "old", containerId: "cont", containerNumber: "MSKU1234567" }, { bookingId: "new", containerId: "cont", containerNumber: "MSKU1234567" }];
  assert.equal(service.selectSmartRoute(routes, { bookingId: "new", containerId: "cont" }).bookingId, "new");
  assert.equal(service.selectSmartRoute(routes, { bookingId: "missing", containerId: "cont" }), undefined);
  assert.notEqual(service.routeIdentity(routes[0]), service.routeIdentity(routes[1]));
});

test("arrival confirms only the assigned destination; handover calls canonical Node API", async () => {
  const harness = createHarness(async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));
  harness.values.set("user", JSON.stringify(user));
  const service = harness.load("src/features/driver/services/smartRouteService.ts");
  const route = { bookingId: "booking-1", containerId: "cont-1", navigation: { destinationNode: { id: "yard-slot" } } };
  await service.arriveAtDestination(route);
  await service.confirmYardContainer(route, "DAMAGED", "  Móp cửa  ");
  assert.equal(harness.requests[0].options.method, "POST");
  assert.deepEqual(JSON.parse(harness.requests[0].options.body), { bookingId: "booking-1", action: "arrive", currentNodeId: "yard-slot" });
  assert.equal(harness.requests[1].url, "http://localhost:4000/api/v1/drivers/me/routes/cont-1/confirm-container");
  assert.deepEqual(JSON.parse(harness.requests[1].options.body), { bookingId: "booking-1", condition: "DAMAGED", notes: "Móp cửa" });
});

test("no route errors are surfaced without retrying or falling back to a different backend", async () => {
  const harness = createHarness(async () => new Response(JSON.stringify({ success: false, message: "Không có tuyến khả dụng." }), { status: 409 }));
  harness.values.set("user", JSON.stringify(user));
  const service = harness.load("src/features/driver/services/smartRouteService.ts");
  await assert.rejects(service.getSmartRoute("cont", "booking"), /Không có tuyến/);
  assert.equal(harness.requests.length, 1);
  assert.equal(harness.values.has("user"), true);
});

test("Smart Route shows Node Core's nested error message instead of a generic HTTP error", async () => {
  const harness = createHarness(async () => new Response(JSON.stringify({ success: false, error: { code: "FORBIDDEN", message: "Tài khoản chưa được liên kết với tài xế đang hoạt động." } }), { status: 403 }));
  harness.values.set("user", JSON.stringify(user));
  await assert.rejects(harness.load("src/features/driver/services/smartRouteService.ts").listSmartRoutes(), /chưa được liên kết/);
  assert.equal(harness.values.has("user"), true);
});
