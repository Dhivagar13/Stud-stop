const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIContext {
  dept?: string;
  semester?: number;
  subjects?: string[];
  name?: string;
}

export async function* streamChat(
  messages: ChatMessage[],
  context?: AIContext
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(context);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'stud-stop://',
      'X-Title': 'Stud-Stop',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} — ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip malformed chunks
      }
    }
  }
}

export async function sendMessage(
  messages: ChatMessage[],
  context?: AIContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'stud-stop://',
      'X-Title': 'Stud-Stop',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} — ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function buildSystemPrompt(context?: AIContext): string {
  const parts = [
    'You are Stud-Stop AI, an academic assistant for college students.',
    'You help students understand concepts, solve problems, and clarify doubts.',
    'Provide clear, concise explanations suitable for undergraduate level.',
    'When explaining code or formulas, use proper formatting.',
    'If you don\'t know something, say so. Do not invent answers.',
    'Keep responses helpful, educational, and encouraging.',
  ];

  if (context?.name) parts.push(`\nStudent: ${context.name}`);
  if (context?.dept) parts.push(`Department: ${context.dept}`);
  if (context?.semester) parts.push(`Semester: ${context.semester}`);
  if (context?.subjects?.length) {
    parts.push(`Current subjects: ${context.subjects.join(', ')}`);
  }

  parts.push('\nAnswer the student\'s academic question thoroughly.');
  return parts.join('\n');
}

export function getAPIConfig() {
  return {
    hasKey: OPENROUTER_API_KEY.length > 0,
    keyPreview: OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.slice(0, 8)}...` : null,
  };
}
