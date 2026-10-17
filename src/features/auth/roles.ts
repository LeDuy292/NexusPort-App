export const ROLE_ROUTES = {
  Driver: "/(driver)",
  "Gate Officer": "/(gate)",
  "Yard Operator": "/(yard)",
  "Berth Staff": "/(yard)",
} as const;

export type AppRole = keyof typeof ROLE_ROUTES;

export function getRoleRoute(role: string) {
  return Object.prototype.hasOwnProperty.call(ROLE_ROUTES, role)
    ? ROLE_ROUTES[role as AppRole]
    : null;
}

export function assertAppRole(role: string, selectedRole?: string) {
  if (!getRoleRoute(role)) {
    throw new Error(`Tài khoản có vai trò ${role}, chưa được hỗ trợ trên ứng dụng này. Vui lòng dùng website quản trị hoặc nhà vận chuyển.`);
  }
  if (selectedRole && role !== selectedRole) {
    throw new Error(`Tài khoản có vai trò ${role}. Vui lòng chọn đúng vai trò để đăng nhập.`);
  }
}
