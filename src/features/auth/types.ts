export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
