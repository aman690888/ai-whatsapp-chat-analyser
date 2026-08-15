import type { ParsedMessage, ChatStats } from './whatsapp-parser';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

const MOCK_RESPONSES: Record<string, (stats: ChatStats) => string> = {
  default: (stats) => {
    const topSender = Object.entries(stats.messagesByUser)
      .sort((a, b) => b[1] - a[1])[0];
    return `Based on the chat data with **${stats.totalMessages} messages** from **${stats.participants.length} participants**, I can see some interesting patterns. ${topSender ? `**${topSender[0]}** is the most active sender with ${topSender[1]} messages.` : ''} Feel free to ask me anything specific about your chat!`;
  },
  who: (stats) => {
    const sorted = Object.entries(stats.messagesByUser).sort((a, b) => b[1] - a[1]);
    const top3 = sorted.slice(0, 3).map(([name, count], i) => `${i + 1}. **${name}** — ${count} messages`).join('\n');
    return `Here are the top senders:\n\n${top3}\n\n**${sorted[0]?.[0] || 'N/A'}** is clearly the most active participant!`;
  },
  total: (stats) => `The chat contains **${stats.totalMessages} total messages** sent by **${stats.participants.length} participants**: ${stats.participants.join(', ')}.`,
  active: (stats) => {
    const sorted = Object.entries(stats.messagesByDate).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    return `The busiest day was **${top?.[0] || 'N/A'}** with **${top?.[1] || 0} messages**. The chat has been active across ${Object.keys(stats.messagesByDate).length} different days.`;
  },
  participant: (stats) => `There are **${stats.participants.length} participants** in this chat: ${stats.participants.map(p => `**${p}**`).join(', ')}.`,
};

function pickResponse(question: string, stats: ChatStats): string {
  const q = question.toLowerCase();
  if (q.includes('who') || q.includes('most') || q.includes('text')) return MOCK_RESPONSES.who(stats);
  if (q.includes('total') || q.includes('how many') || q.includes('count')) return MOCK_RESPONSES.total(stats);
  if (q.includes('active') || q.includes('busy') || q.includes('day') || q.includes('when')) return MOCK_RESPONSES.active(stats);
  if (q.includes('participant') || q.includes('member') || q.includes('people')) return MOCK_RESPONSES.participant(stats);
  return MOCK_RESPONSES.default(stats);
}

export async function askAI(
  question: string,
  _messages: ParsedMessage[],
  stats: ChatStats
): Promise<string> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1800 + Math.random() * 800));
  return pickResponse(question, stats);
}
