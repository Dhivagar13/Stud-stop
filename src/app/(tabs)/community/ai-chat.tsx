import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInUp, SlideInUp } from 'react-native-reanimated';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import { streamChat, sendMessage, getAPIConfig } from '../../../lib/ai';
import { typography, borderRadius } from '../../../lib/theme';

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);

  const [messages, setMessages] = useState<ChatEntry[]>([{
    id: 'welcome',
    role: 'assistant',
    content: 'Hi! I\'m your AI study assistant. Ask me anything about your coursework, concepts, or assignments.',
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const apiConfig = getAPIConfig();

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    if (!apiConfig.hasKey) {
      Alert.alert(
        'API Key Required',
        'Set EXPO_PUBLIC_OPENROUTER_API_KEY in your .env file to use AI features.\n\nGet a free key at openrouter.ai/keys'
      );
      return;
    }

    const userMsg: ChatEntry = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const aiMessages = messages
      .filter((m) => m.id !== 'welcome')
      .concat(userMsg)
      .map((m) => ({ role: m.role, content: m.content }));

    const assistantId = (Date.now() + 1).toString();
    const assistantEntry: ChatEntry = { id: assistantId, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantEntry]);

    try {
      let fullContent = '';
      for await (const chunk of streamChat(aiMessages, {
        dept: profile?.dept,
        semester: profile?.semester,
        name: profile?.name,
      })) {
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Sorry, I encountered an error: ${err.message}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  const renderMessage = useCallback(({ item, index }: { item: ChatEntry; index: number }) => {
    const isUser = item.role === 'user';
    return (
      <Animated.View
        entering={FadeInUp.delay(50).springify()}
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.accent }]
            : [styles.aiBubble, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }],
        ]}
      >
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: theme.accentSecondary + '30' }]}>
            <Ionicons name="sparkles" size={14} color={theme.accentSecondary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[typography.body, { color: isUser ? '#fff' : theme.text }]}>
            {item.content || (isLoading && index === messages.length - 1 ? '...' : '')}
          </Text>
        </View>
      </Animated.View>
    );
  }, [theme, isLoading]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: theme.glassBorder }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[typography.h3, { color: theme.text }]}>AI Assistant</Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            {apiConfig.hasKey ? 'Connected' : 'No API key set'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
          <Ionicons name="information-circle-outline" size={22} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {showSettings && (
        <Animated.View entering={SlideInUp.springify()} style={[styles.settingsBar, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
          <Ionicons name="shield-checkmark" size={16} color={apiConfig.hasKey ? theme.success : theme.warning} />
          <Text style={[typography.caption, { color: theme.textMuted, marginLeft: 8 }]}>
            {apiConfig.hasKey
              ? `OpenRouter: ${apiConfig.keyPreview}`
              : 'Set EXPO_PUBLIC_OPENROUTER_API_KEY in .env'}
          </Text>
        </Animated.View>
      )}

      <FlatList
        ref={flatRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd()}
        windowSize={5}
        initialNumToRender={8}
      />

      {isLoading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[typography.caption, { color: theme.textMuted, marginLeft: 8 }]}>Thinking...</Text>
        </View>
      )}

      <View style={[styles.inputBar, { borderTopColor: theme.glassBorder, backgroundColor: theme.surface }]}>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.glass, borderColor: theme.glassBorder }]}
          placeholder="Ask anything..."
          placeholderTextColor={theme.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? theme.accent : theme.glass }]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Ionicons name="send" size={18} color={input.trim() ? '#fff' : theme.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 12, borderBottomWidth: 1,
  },
  settingsBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8,
    padding: 10, borderRadius: borderRadius.sm, borderWidth: 1,
  },
  messageList: { padding: 16, paddingBottom: 8 },
  messageBubble: {
    flexDirection: 'row', maxWidth: '85%', marginBottom: 12,
    padding: 14, borderRadius: 18,
  },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', borderWidth: 1, borderBottomLeftRadius: 4, gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12,
    paddingVertical: 8, paddingBottom: 24, borderTopWidth: 1, gap: 8,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 14, maxHeight: 100,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
