import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="doubts" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="ai-chat" />
      <Stack.Screen name="doubt/[id]" />
    </Stack>
  );
}
