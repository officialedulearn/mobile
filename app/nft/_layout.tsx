import { Stack } from "expo-router";

export default function NFTLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        header: () => null,
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
      />
  );
}
