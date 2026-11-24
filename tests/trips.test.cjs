const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/loadTypeScript.cjs");

const user = {
  id: "driver-uuid-001",
  username: "tiendriver",
  role: "Driver",
  isActive: true,
  token: "jwt-driver-token",
};

const mockTrip = {
  id: "trip-uuid-101",
  tripCode: "TRIP-2026-001",
  orderCode: "ORD-2026-001",
  driverId: "driver-uuid-001",
  bookingId: "booking-uuid-201",
  bookingCode: "BK-2026-DANANG",
  truckPlate: "43C-999.88",
  containerNo: "MSKU1234567",
  containerType: "40HC",
  cargoType: "Dry Cargo",
  gateInCode: "GATE-01",
  gateOutCode: "GATE-02",
  yardBlock: "Block B",
  yardSlot: "B02-04-3",
  status: "Assigned",
  statusGroup: "ASSIGNED",
  timeline: {
    acknowledged: null,
    vehiclePickedUp: null,
    containerPickedUp: null,
    gateIn: null,
    inTransit: null,
    arrivedAtYard: null,
    containerDelivered: null,
    gateOut: null,
    vehicleReturned: null,
    completed: null,
  },
  createdAt: "2026-10-25T00:00:00Z",
  updatedAt: "2026-10-25T00:00:00Z",
};

test("getMyTrips queries Express /api/driver/trips with JWT and status filter", async () => {
  const harness = createHarness(async (url) => {
    return new Response(
      JSON.stringify({
        success: true,
        data: { trips: [mockTrip], total: 1, page: 1, limit: 20, totalPages: 1 },
      }),
      { status: 200 }
    );
  });
  harness.values.set("user", JSON.stringify(user));

  const service = harness.load("src/features/driver/services/tripService.ts");
  const result = await service.getMyTrips({ status: "IN_PROGRESS", page: 1, limit: 10 });

  assert.equal(result.total, 1);
  assert.equal(result.trips[0].tripCode, "TRIP-2026-001");

  const req = harness.requests[0];
  assert.equal(req.url, "http://localhost:3001/api/driver/trips?status=IN_PROGRESS&page=1&limit=10");
  assert.equal(req.options.headers.get("Authorization"), "Bearer jwt-driver-token");
});

test("getTransportOrders falls back to getMyTrips if 404 endpoint occurs", async () => {
  let callCount = 0;
  const harness = createHarness(async (url) => {
    callCount++;
    if (url.includes("/api/driver/transport-orders")) {
      return new Response(JSON.stringify({ success: false, message: "Not found" }), { status: 404 });
    }
    return new Response(
      JSON.stringify({
        success: true,
        data: { trips: [mockTrip], total: 1, page: 1, limit: 20, totalPages: 1 },
      }),
      { status: 200 }
    );
  });
  harness.values.set("user", JSON.stringify(user));

  const service = harness.load("src/features/driver/services/tripService.ts");
  const result = await service.getTransportOrders({ status: "Assigned" });

  assert.equal(callCount, 2);
  assert.equal(result.total, 1);
  assert.equal(result.trips[0].id, "trip-uuid-101");
});

test("new and legacy pre-entry trips begin at arrival for both booking types", () => {
  const { buildTripFlow, dispatchBadge, isBeforeGateIn } = createHarness().load("src/features/driver/tripFlow.ts");
  for (const status of ["Assigned", "Acknowledged", "Vehicle Picked Up", "Container Picked Up"]) {
    assert.equal(isBeforeGateIn(status), true);
    for (const bookingType of ["Pickup", "Dropoff"]) {
      const trip = { ...mockTrip, status, bookingType };
      const booking = { dispatch: { status: "withdrawn" } };
      const flow = buildTripFlow(trip, booking);
      assert.equal(flow.current.key, "arrive");
      assert.equal(dispatchBadge(trip, booking).label, "Chưa báo đến cổng");
      const stepKeys = Array.from(flow.phases.flatMap(phase => phase.steps.map(step => step.key)));
      assert.deepEqual(stepKeys, ["arrive", "call", "gatein", "yard", "handover", "gateout", "finish"]);
    }
  }
});

test("arrival waits for the call and recorded gate passage before work in the yard", () => {
  const { buildTripFlow, isBeforeGateIn } = createHarness().load("src/features/driver/tripFlow.ts");
  for (const [status, nextStep] of [["ready", "call"], ["called", "call"], ["acknowledged", "gatein"]]) {
    const booking = { dispatch: { status } };
    assert.equal(buildTripFlow(mockTrip, booking).current.key, nextStep);
  }
  assert.equal(isBeforeGateIn("Gate In"), false);
  assert.equal(buildTripFlow({ ...mockTrip, status: "Gate In" }).current.key, "yard");
  for (const [bookingType, prefix] of [["Pickup", "Nhận"], ["Dropoff", "Giao"]]) {
    const flow = buildTripFlow({ ...mockTrip, status: "Arrived at Yard", bookingType });
    assert.equal(flow.current.label, prefix + " container tại bãi");
  }
});

test("gateIn and arriveAtYard update yard arrival progress", async () => {
  const inTransitTrip = { ...mockTrip, status: "In Transit" };
  const arrivedTrip = { ...mockTrip, status: "Arrived at Yard" };
  const harness = createHarness(async (url) => {
    if (url.includes("/gate-in")) {
      return new Response(JSON.stringify({ success: true, data: { trip: inTransitTrip } }), { status: 200 });
    }
    return new Response(JSON.stringify({ success: true, data: { trip: arrivedTrip } }), { status: 200 });
  });
  harness.values.set("user", JSON.stringify(user));

  const service = harness.load("src/features/driver/services/tripService.ts");
  const gateInRes = await service.gateIn("trip-uuid-101");
  assert.equal(gateInRes.status, "In Transit");

  const arriveRes = await service.arriveAtYard("trip-uuid-101", "Đã dừng tại Block B Slot 3");
  assert.equal(arriveRes.status, "Arrived at Yard");
});

test("deliverContainer records seal, condition, and recipient for e-EIR", async () => {
  const deliveredTrip = {
    ...mockTrip,
    status: "Container Delivered",
    sealNo: "SEAL-998877",
    containerCondition: "OK",
    recipientName: "Trần Văn Cẩu",
  };
  const deliveryData = {
    sealNo: "SEAL-998877",
    containerCondition: "OK",
    recipientName: "Trần Văn Cẩu",
    note: "Container nguyên vẹn, đã hạ an toàn",
  };
  const harness = createHarness(async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/driver/trips/trip-uuid-101/deliver-container");
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), deliveryData);
    return new Response(JSON.stringify({ success: true, data: { trip: deliveredTrip } }), { status: 200 });
  });
  harness.values.set("user", JSON.stringify(user));

  const service = harness.load("src/features/driver/services/tripService.ts");
  const result = await service.deliverContainer("trip-uuid-101", deliveryData);

  assert.equal(result.status, "Container Delivered");
  assert.equal(result.sealNo, "SEAL-998877");
});

test("gateOut and returnVehicle complete the full trip lifecycle", async () => {
  const gateOutTrip = { ...mockTrip, status: "Gate Out Completed" };
  const completedTrip = { ...mockTrip, status: "Completed" };
  const harness = createHarness(async (url) => {
    if (url.includes("/gate-out")) {
      return new Response(JSON.stringify({ success: true, data: { trip: gateOutTrip } }), { status: 200 });
    }
    return new Response(JSON.stringify({ success: true, data: { trip: completedTrip } }), { status: 200 });
  });
  harness.values.set("user", JSON.stringify(user));

  const service = harness.load("src/features/driver/services/tripService.ts");
  const gateOutRes = await service.gateOut("trip-uuid-101");
  assert.equal(gateOutRes.status, "Gate Out Completed");

  const returnRes = await service.returnVehicle("trip-uuid-101", "Đã trả đầu kéo về bãi đỗ");
  assert.equal(returnRes.status, "Completed");
});

test("getYardNavigation returns internal routing coordinates and navigation flags", async () => {
  const navData = {
    tripId: "trip-uuid-101",
    tripCode: "TRIP-2026-001",
    status: "In Transit",
    canNavigate: true,
    isNavigable: true,
    isYardValid: true,
    yard: {
      name: "Cảng Tiên Sa",
      address: "01 Yết Kiêu, Thọ Quang, Sơn Trà, Đà Nẵng",
      block: "B",
      slot: "B02-04-3",
      gateInCode: "GATE-01",
      gateOutCode: "GATE-02",
      coordinates: { lat: 16.1265, lng: 108.2225 },
      mapUrl: "https://maps.example.com",
    },
    container: { containerNo: "MSKU1234567" },
    vehicle: { truckPlate: "43C-999.88" },
  };

  const harness = createHarness(async (url) => {
    assert.equal(url, "http://localhost:3001/api/driver/trips/trip-uuid-101/yard-navigation");
    return new Response(JSON.stringify({ success: true, data: navData }), { status: 200 });
  });
  harness.values.set("user", JSON.stringify(user));

  const service = harness.load("src/features/driver/services/tripService.ts");
  const result = await service.getYardNavigation("trip-uuid-101");

  assert.equal(result.canNavigate, true);
  assert.equal(result.yard.block, "B");
  assert.equal(result.yard.slot, "B02-04-3");
});
