import { Stack } from 'expo-router';

export default function PlacementLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="quiz/[id]" />
      <Stack.Screen name="company/[id]" />
    </Stack>
  );
}
