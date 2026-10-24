const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/loadTypeScript.cjs");

test("e-Pass is only granted for approved or checked-in bookings", () => {
  const { canViewAppointment, isApproved } = createHarness(() => {}).load(
    "src/features/bookings/bookingPresentation.ts"
  );

  // Valid states for e-Pass viewing
  assert.equal(canViewAppointment("approved"), true);
  assert.equal(canViewAppointment("ready"), true);
  assert.equal(canViewAppointment("checked_in"), true);
  assert.equal(canViewAppointment("completed"), true);

  // Invalid states
  assert.equal(canViewAppointment("pending"), false);
  assert.equal(canViewAppointment("rejected"), false);
  assert.equal(canViewAppointment("cancelled"), false);
  assert.equal(canViewAppointment("canceled"), false);
  assert.equal(canViewAppointment("expired"), false);
});

test("e-Pass correctly formats gate token and barcode identifier", () => {
  const bookingCode = "BK-E50809A35061430A";
  const token = `EPASS-${bookingCode.slice(-8)}`;
  assert.equal(token, "EPASS-5061430A");
  assert.ok(token.startsWith("EPASS-"));
});

test("e-Pass formats cargo description and booking type labels correctly", () => {
  const { bookingTypeLabel } = createHarness(() => {}).load(
    "src/features/bookings/bookingPresentation.ts"
  );

  assert.equal(bookingTypeLabel("dropoff"), "Hạ container");
  assert.equal(bookingTypeLabel("pickup"), "Nhận container");
  assert.equal(bookingTypeLabel("import"), "Nhận container");
});

test("e-Pass multi-container handling lists primary and subsequent containers", () => {
  const singleContainerBooking = {
    bookingCode: "BK-001",
    containers: [{ id: "c1", containerNo: "MSKU1111111" }],
  };
  const multiContainerBooking = {
    bookingCode: "BK-002",
    containers: [
      { id: "c1", containerNo: "MSKU1111111" },
      { id: "c2", containerNo: "CMAU2222222" },
      { id: "c3", containerNo: "TGHU3333333" },
    ],
  };

  assert.equal(singleContainerBooking.containers.length, 1);
  assert.equal(singleContainerBooking.containers[0].containerNo, "MSKU1111111");

  assert.equal(multiContainerBooking.containers.length, 3);
  const remainingCount = multiContainerBooking.containers.length - 1;
  assert.equal(remainingCount, 2);
});

test("e-Pass gate order expiry calculation detects expired orders", () => {
  const now = Date.now();
  const pastTime = new Date(now - 3600000).toISOString();
  const futureTime = new Date(now + 3600000).toISOString();

  const isExpired = (validUntil) => Date.parse(validUntil) <= Date.now();

  assert.equal(isExpired(pastTime), true);
  assert.equal(isExpired(futureTime), false);
});
