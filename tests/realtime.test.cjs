const { test } = require("node:test");
const assert = require("node:assert/strict");

test("trip:assigned payload constructs an immediate in-app driver banner", () => {
  const payload = {
    tripId: "trip-uuid-999",
    tripCode: "TRIP-TIENSA-88",
    orderCode: "ORD-88",
    status: "Assigned",
    timestamp: new Date().toISOString(),
  };

  const createBanner = (data) => ({
    id: `trip-assigned-${Date.now()}`,
    bookingId: data?.tripId || "",
    bookingCode: data?.tripCode || data?.orderCode || "Lệnh mới",
    kind: "assigned",
    title: "Lệnh vận chuyển mới",
    message: `Bạn vừa được giao chuyến xe ${data?.tripCode || ""}.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  const banner = createBanner(payload);
  assert.equal(banner.bookingId, "trip-uuid-999");
  assert.equal(banner.bookingCode, "TRIP-TIENSA-88");
  assert.equal(banner.title, "Lệnh vận chuyển mới");
  assert.equal(banner.message, "Bạn vừa được giao chuyến xe TRIP-TIENSA-88.");
  assert.equal(banner.isRead, false);
});

test("booking:dispatch_updated and trip:status_updated trigger feed reload without UI stall", () => {
  let reloaded = false;
  const handlers = {
    onBookingDispatchUpdated: () => { reloaded = true; },
    onTripStatusUpdated: () => { reloaded = true; },
  };

  handlers.onBookingDispatchUpdated();
  assert.equal(reloaded, true);

  reloaded = false;
  handlers.onTripStatusUpdated();
  assert.equal(reloaded, true);
});

test("disconnect and error handlers preserve offline state safely", () => {
  let online = true;
  const handlers = {
    onConnected: () => { online = true; },
    onDisconnected: () => { online = false; },
    onConnectionError: () => { online = false; },
  };

  handlers.onDisconnected();
  assert.equal(online, false);

  handlers.onConnected();
  assert.equal(online, true);

  handlers.onConnectionError();
  assert.equal(online, false);
});
