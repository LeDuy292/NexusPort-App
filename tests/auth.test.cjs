const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/loadTypeScript.cjs");

const driver = { id: "driver-user-id", username: "driver01", email: "driver@example.com", fullName: "Tài xế thử nghiệm", role: "Driver", isActive: true };
const authPath = "src/features/auth/authService.ts";
const storagePath = "src/features/auth/sessionStorage.ts";
const clientPath = "src/lib/apiClient.ts";
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
const session = (user = driver, token = "test-token") => JSON.stringify({ ...user, token });

test("login sends real credentials, persists server identity/JWT and never stores password", async () => {
  const harness = createHarness(async () => reply({ success: true, data: { token: "server-token", user: driver } }));
  const { login } = harness.load(authPath);
  await login("  driver01  ", " password with spaces ", "Driver");
  const { url, options } = harness.requests[0];
  assert.equal(url, "http://localhost:3001/api/auth/login");
  assert.equal(options.method, "POST");
  assert.deepEqual(JSON.parse(options.body), { username: "driver01", password: " password with spaces " });
  assert.equal(options.headers.has("Authorization"), false);
  assert.deepEqual(JSON.parse(harness.values.get("user")), { ...driver, token: "server-token" });
});

test("wrong password / inactive account does not create a session", async () => {
  for (const status of [401, 403]) {
    const harness = createHarness(async () => reply({ success: false, message: "Đăng nhập bị từ chối" }, status));
    await assert.rejects(harness.load(authPath).login("driver01", "wrong", "Driver"), /Đăng nhập bị từ chối/);
    assert.equal(harness.values.has("user"), false);
  }
});

test("Carrier cannot impersonate Driver by selecting Driver on the login screen", async () => {
  const carrier = { ...driver, username: "carrier01", role: "Transport Company" };
  const harness = createHarness(async () => reply({ data: { token: "carrier-token", user: carrier } }));
  await assert.rejects(harness.load(authPath).login("carrier01", "password", "Driver"), /chưa được hỗ trợ/);
  assert.equal(harness.values.has("user"), false);
});

test("supported account must match the selected role", async () => {
  const harness = createHarness(async () => reply({ data: { token: "token", user: driver } }));
  await assert.rejects(harness.load(authPath).login("driver01", "password", "Gate Officer"), /chọn đúng vai trò/);
  assert.equal(harness.values.has("user"), false);
});

test("legacy demo sessions and malformed storage do not authenticate", async () => {
  const harness = createHarness(() => { throw new Error("should not fetch"); });
  const { restoreSession } = harness.load(authPath);
  for (const raw of [JSON.stringify({ username: "demo", role: "Driver" }), "invalid JSON", "null"]) {
    harness.values.set("user", raw);
    assert.equal(await restoreSession(), null);
    assert.equal(harness.values.has("user"), false);
  }
  assert.equal(harness.requests.length, 0);
});

test("restoring session calls /me and refreshes user details from the server", async () => {
  const fresh = { ...driver, fullName: "Tên đã cập nhật", role: "Gate Officer" };
  const harness = createHarness(async () => reply({ data: { user: fresh } }));
  harness.values.set("user", session());
  const result = await harness.load(authPath).restoreSession();
  assert.equal(harness.requests[0].url, "http://localhost:3001/api/auth/me");
  assert.equal(harness.requests[0].options.headers.get("Authorization"), "Bearer test-token");
  assert.equal(result.user.fullName, fresh.fullName);
  assert.equal(result.user.role, fresh.role);
  assert.equal(JSON.parse(harness.values.get("user")).role, fresh.role);
});

test("expired JWT on restore clears the session", async () => {
  const harness = createHarness(async () => reply({ message: "Token hết hạn" }, 401));
  harness.values.set("user", session());
  assert.equal(await harness.load(authPath).restoreSession(), null);
  assert.equal(harness.values.has("user"), false);
});

test("network/server failure preserves stored session for retry", async () => {
  for (const fetchHandler of [async () => { throw new TypeError("offline"); }, async () => reply({ message: "Unavailable" }, 503)]) {
    const harness = createHarness(fetchHandler);
    harness.values.set("user", session());
    await assert.rejects(harness.load(authPath).restoreSession());
    assert.equal(harness.values.get("user"), session());
  }
});

test("inactive or unsupported user returned by /me clears access", async () => {
  for (const user of [{ ...driver, isActive: false }, { ...driver, role: "Transport Company" }]) {
    const harness = createHarness(async () => reply({ data: { user } }));
    harness.values.set("user", session());
    assert.equal(await harness.load(authPath).restoreSession(), null);
    assert.equal(harness.values.has("user"), false);
  }
});

test("authenticated 401 notifies auth state while 403 keeps the valid session", async () => {
  for (const status of [401, 403]) {
    const harness = createHarness(async () => reply({ message: "Denied" }, status));
    harness.values.set("user", session());
    const client = harness.load(clientPath);
    let expired = 0;
    client.onSessionExpired(() => expired++);
    await assert.rejects(client.apiRequest("/api/driver/trips"));
    assert.equal(expired, status === 401 ? 1 : 0);
    assert.equal(harness.values.has("user"), status !== 401);
  }
});

test("late 401 from a previous account does not clear a newer session", async () => {
  const harness = createHarness(async () => {
    harness.values.set("user", session({ ...driver, id: "new-user" }, "new-token"));
    return reply({ message: "Expired old token" }, 401);
  });
  harness.values.set("user", session());
  await assert.rejects(harness.load(clientPath).apiRequest("/api/driver/trips"));
  assert.equal(JSON.parse(harness.values.get("user")).token, "new-token");
});

test("backend URL override accepts an /api suffix without duplicating it", async () => {
  const harness = createHarness(async () => reply({ data: { token: "token", user: driver } }));
  harness.values.set("api_base_url", "http://192.168.1.10:3001/api/");
  await harness.load(authPath).login("driver01", "password", "Driver");
  assert.equal(harness.requests[0].url, "http://192.168.1.10:3001/api/auth/login");
});

test("trip APIs do not retry expired authentication through a fallback endpoint", async () => {
  const harness = createHarness(async () => reply({ message: "Expired" }, 401));
  harness.values.set("user", session());
  await assert.rejects(harness.load("src/features/driver/services/tripService.ts").getTransportOrders());
  assert.equal(harness.requests.length, 1);
});

test("sign-out storage operation removes all account data", async () => {
  const harness = createHarness(() => { throw new Error("should not fetch"); });
  harness.values.set("user", session());
  await harness.load(storagePath).clearSession();
  assert.equal(harness.values.has("user"), false);
});
