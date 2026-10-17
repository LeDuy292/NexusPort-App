import { Redirect } from "expo-router";

// Reuse the paginated, authenticated trip list instead of a separate demo history.
export default function DriverHistory() {
  return <Redirect href={{ pathname: "/(driver)/trips", params: { status: "COMPLETED" } }} />;
}
