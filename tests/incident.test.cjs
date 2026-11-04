const { test } = require("node:test");
const assert = require("node:assert/strict");

const INCIDENT_CATEGORIES = [
  { id: "VEHICLE", title: "Hỏng phương tiện" },
  { id: "TRAFFIC", title: "Kẹt xe / Nguy cơ trễ hẹn" },
  { id: "CONTAINER", title: "Hư hại Container / Seal" },
  { id: "YARD", title: "Sự cố trong bãi / Cẩu bãi" },
  { id: "OTHER", title: "Sự cố khác" },
];

function validateIncidentReport({ category, urgency, description }) {
  if (!category || !INCIDENT_CATEGORIES.some((c) => c.id === category)) {
    throw new Error("Danh mục sự cố không hợp lệ.");
  }
  if (!["NORMAL", "HIGH"].includes(urgency)) {
    throw new Error("Mức độ khẩn cấp không hợp lệ.");
  }
  if (!description || !description.trim()) {
    throw new Error("Vui lòng nhập mô tả chi tiết sự cố bạn đang gặp phải.");
  }
  return {
    category,
    urgency,
    description: description.trim(),
    reportedAt: new Date().toISOString(),
    status: "REPORTED",
  };
}

test("validateIncidentReport accepts valid vehicle incident with normal urgency", () => {
  const result = validateIncidentReport({
    category: "VEHICLE",
    urgency: "NORMAL",
    description: "Xe bị rò rỉ dầu thủy lực nhẹ, cần kiểm tra sau khi hạ hàng.",
  });
  assert.equal(result.category, "VEHICLE");
  assert.equal(result.urgency, "NORMAL");
  assert.equal(result.status, "REPORTED");
  assert.ok(result.reportedAt);
});

test("validateIncidentReport accepts urgent container damage incident", () => {
  const result = validateIncidentReport({
    category: "CONTAINER",
    urgency: "HIGH",
    description: "Container bị móp méo nặng ở góc nóc và đứt seal bảo quản lạnh.",
  });
  assert.equal(result.category, "CONTAINER");
  assert.equal(result.urgency, "HIGH");
});

test("validateIncidentReport rejects missing or whitespace-only description", () => {
  assert.throws(
    () => validateIncidentReport({ category: "TRAFFIC", urgency: "NORMAL", description: "" }),
    /Vui lòng nhập mô tả/
  );
  assert.throws(
    () => validateIncidentReport({ category: "TRAFFIC", urgency: "NORMAL", description: "   " }),
    /Vui lòng nhập mô tả/
  );
});

test("validateIncidentReport rejects invalid category or urgency level", () => {
  assert.throws(
    () => validateIncidentReport({ category: "UNKNOWN", urgency: "NORMAL", description: "Hỏng xe" }),
    /Danh mục sự cố không hợp lệ/
  );
  assert.throws(
    () => validateIncidentReport({ category: "VEHICLE", urgency: "CRITICAL", description: "Hỏng xe" }),
    /Mức độ khẩn cấp không hợp lệ/
  );
});

test("emergency port hotlines are correctly configured", () => {
  const HOTLINES = {
    dispatcher: "1900 6868",
    rescue: "0236 3822 555",
    gateSecurity: "0236 3822 111",
  };
  assert.equal(HOTLINES.dispatcher, "1900 6868");
  assert.equal(HOTLINES.rescue, "0236 3822 555");
  assert.equal(HOTLINES.gateSecurity, "0236 3822 111");
});
