import type { ParsedMessage, ChatStats } from './whatsapp-parser';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export const GEMINI_MODEL = 'gemini-3.6-flash';

const API_KEY_STORAGE = 'chatlens_gemini_api_key';

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

function buildContext(messages: ParsedMessage[], stats: ChatStats): string {
  const topSenders = Object.entries(stats.messagesByUser)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name}: ${count} messages`)
    .join(', ');

  const busyDays = Object.entries(stats.messagesByDate)
    .sort((a, b) => b[1] - a[1])
    .map(([d, c]) => `${d} (${c})`)
    .join(', ');

  // Include actual messages for richer answers
  const sample = messages
    .map(m => `[${m.date} ${m.time}] ${m.sender}: ${m.message}`)
    .join('\n');

  const recentSample = sample.length > 800_000 ? sample.slice(-800_000) : sample;

  return `You are an assistant analyzing a WhatsApp chat export.

STATISTICS:
- Total messages: ${stats.totalMessages}
- Participants (${stats.participants.length}): ${stats.participants.join(', ')}
- Messages per person: ${topSenders}
- Busiest days: ${busyDays}

FULL CHAT HISTORY:
${recentSample}

Answer factually based on the above data.`;
}

export async function askGemini(
  question: string,
  messages: ParsedMessage[],
  stats: ChatStats,
  apiKey: string,
  history: ChatMessage[] = [],
  maxOutputTokens = 4096,
  model = GEMINI_MODEL
): Promise<string> {
  if (!apiKey) throw new Error('NO_API_KEY');

  const systemContext = buildContext(messages, stats);

  const validHistory = history
    .filter(h => h.id !== '0' && h.content.trim().length > 0)
    .map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

  const contents = [
    ...validHistory,
    {
      role: 'user',
      parts: [{ text: question }],
    },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemContext }],
        },
        contents,
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
        generationConfig: {
          maxOutputTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    const msg = err?.error?.message || response.statusText;
    throw new Error(msg);
  }

  const data = await response.json();
  console.log('RAW GEMINI API DATA:', data);
  const finalResponseText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
  console.log('GEMINI FULL RESPONSE: ', finalResponseText);
  return finalResponseText.trim();
}
