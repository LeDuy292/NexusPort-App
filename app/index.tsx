import { Redirect } from "expo-router";
import { useAuth } from "../src/features/auth/AuthProvider";
import { getRoleRoute } from "../src/features/auth/roles";

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={(user && getRoleRoute(user.role)) || "/(auth)/login"} />;
}
