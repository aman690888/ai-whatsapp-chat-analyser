import type { ParsedMessage, ChatStats } from './whatsapp-parser';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

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
    .slice(0, 10)
    .map(([name, count]) => `${name}: ${count} messages`)
    .join(', ');

  const busyDays = Object.entries(stats.messagesByDate)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d, c]) => `${d} (${c})`)
    .join(', ');

  // Include a sample of actual messages (last 200) for richer answers
  const sample = messages
    .map(m => `[${m.date} ${m.time}] ${m.sender}: ${m.message}`)
    .join('\n');

  return `You are an assistant analyzing a WhatsApp chat export.

STATISTICS:
- Total messages: ${stats.totalMessages}
- Participants (${stats.participants.length}): ${stats.participants.join(', ')}
- Messages per person: ${topSenders}
- Busiest days: ${busyDays}

FULL CHAT HISTORY:
${sample}

Answer concisely and factually based on the above data.`;
}

export async function askGemini(
  question: string,
  messages: ParsedMessage[],
  stats: ChatStats,
  apiKey: string
): Promise<string> {
  if (!apiKey) throw new Error('NO_API_KEY');

  const systemContext = buildContext(messages, stats);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemContext}\n\nUser question: ${question}` }],
          },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as any)?.error?.message || response.statusText;
    throw new Error(msg);
  }

  const data = await response.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
  return text.trim();
}
