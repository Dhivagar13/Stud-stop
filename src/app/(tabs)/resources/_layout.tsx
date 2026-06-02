import { Stack } from 'expo-router';

export default function ResourcesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="notes" />
      <Stack.Screen name="papers" />
      <Stack.Screen name="upload" />
    </Stack>
  );
}
