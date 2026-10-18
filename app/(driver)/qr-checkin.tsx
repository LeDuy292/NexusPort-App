import { Redirect } from "expo-router";

// Vehicle entry is recorded by the authenticated gate API.
export default function DriverCheckIn() { return <Redirect href="/(driver)/yard-navigation" />; }
