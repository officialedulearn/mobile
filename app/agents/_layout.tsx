import { Stack } from "expo-router";

export default function AgentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        header: () => null,
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          header: () => null,
          title: "",
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          headerShown: false,
          header: () => null,
          title: "",
        }}
      />
    </Stack>
  );
}
