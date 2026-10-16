import { Stack } from "expo-router";

export default function GateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#080808" },
        animation: "slide_from_right",
      }}
    />
  );
}
