export interface ParsedMessage {
  date: string;
  time: string;
  sender: string;
  message: string;
  timestamp: Date;
}

export interface ChatStats {
  totalMessages: number;
  participants: string[];
  messagesByUser: Record<string, number>;
  messagesByDate: Record<string, number>;
  messagesByMonth: Record<string, number>;
  wordsByUser: Record<string, number>;
  avgWordsPerMessage: Record<string, number>;
  messagesByHour: Record<number, number>;
  messagesByDayOfWeek: Record<string, number>;
  topEmojis: { emoji: string; count: number }[];
  // Behavioral metrics
  conversationStarters: Record<string, number>;
  mediaLinkSharer: Record<string, number>;
  doubleTexter: Record<string, number>;
}

// Matches: DD/MM/YYYY, HH:MM - Sender: Message
// Also handles MM/DD/YY format
const MSG_LINE_REGEX = /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\s*[-–]\s*([^:]+?):\s*(.*)/;

// Emoji regex — matches most Unicode emoji sequences
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

export function parseWhatsAppChat(text: string): ParsedMessage[] {
  const lines = text.split('\n');
  const messages: ParsedMessage[] = [];
  let current: ParsedMessage | null = null;

  for (const line of lines) {
    const match = line.match(MSG_LINE_REGEX);
    if (match) {
      if (current) messages.push(current);
      const [, date, time, sender, message] = match;
      const dateStr = date.trim();
      const timeStr = time.trim();
      const parts = dateStr.split(/[\/\-\.]/);
      let dateObj: Date;
      try {
        if (parts[2]?.length === 4) {
          dateObj = new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`);
        } else {
          dateObj = new Date(`20${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`);
        }
      } catch {
        dateObj = new Date();
      }
      current = {
        date: dateStr,
        time: timeStr,
        sender: sender.trim(),
        message: message.trim(),
        timestamp: isNaN(dateObj.getTime()) ? new Date() : dateObj,
      };
    } else if (current && line.trim()) {
      current.message += '\n' + line.trim();
    }
  }
  if (current) messages.push(current);

  const SYSTEM_PATTERNS = [
    /Messages and calls are end-to-end encrypted/i,
    /Your security code with/i,
    /changed their phone number/i,
    /\u200e?Messages to this group are now secured/i,
    /\u200e?Messages to this chat are now secured/i,
    /^<Media omitted>$/i,
    /^This message was deleted$/i,
    /^null$/i,
    /changed the subject/i,
    /changed the group/i,
    /added you$/i,
    /left$/i,
    /was added$/i,
    /^You joined using this group's invite link$/i,
    /^Your messages and calls are secured with end-to-end encryption/i,
  ];

  const isSystemSender = (sender: string) =>
    sender.length === 0 ||
    /^\+?\d[\d\s\-()]{6,}$/.test(sender) && sender.length < 5;

  return messages.filter(m => {
    if (isSystemSender(m.sender)) return false;
    if (SYSTEM_PATTERNS.some(p => p.test(m.message))) return false;
    if (/^[\u200e\u200f\u202a-\u202e]/.test(m.sender)) return false;
    return true;
  });
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MEDIA_REGEX = /<Media omitted>/i;
const URL_REGEX = /https?:\/\/\S+/i;

export function computeStats(messages: ParsedMessage[]): ChatStats {
  const messagesByUser: Record<string, number> = {};
  const messagesByDate: Record<string, number> = {};
  const messagesByMonth: Record<string, number> = {};
  const wordsByUser: Record<string, number> = {};
  const messagesByHour: Record<number, number> = {};
  const messagesByDayOfWeek: Record<string, number> = {};
  const emojiCount: Record<string, number> = {};
  const conversationStarters: Record<string, number> = {};
  const mediaLinkSharer: Record<string, number> = {};
  const doubleTexter: Record<string, number> = {};
  const participantSet = new Set<string>();

  for (let h = 0; h < 24; h++) messagesByHour[h] = 0;
  for (const d of DAYS) messagesByDayOfWeek[d] = 0;

  // ── Behavioral passes ──────────────────────────────────────────────────────

  // Conversation starters: gap > 8 hours from previous message
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (i === 0) {
      conversationStarters[msg.sender] = (conversationStarters[msg.sender] || 0) + 1;
      continue;
    }
    const prev = messages[i - 1];
    const gapHours = (msg.timestamp.getTime() - prev.timestamp.getTime()) / 3_600_000;
    if (gapHours > 8) {
      conversationStarters[msg.sender] = (conversationStarters[msg.sender] || 0) + 1;
    }
  }

  // Double-texter: 3+ consecutive messages without a reply
  let streak = 1;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].sender === messages[i - 1].sender) {
      streak++;
      if (streak === 3) {
        const sender = messages[i].sender;
        doubleTexter[sender] = (doubleTexter[sender] || 0) + 1;
      }
    } else {
      streak = 1;
    }
  }

  // ── Main stats loop ────────────────────────────────────────────────────────
  for (const msg of messages) {
    participantSet.add(msg.sender);
    messagesByUser[msg.sender] = (messagesByUser[msg.sender] || 0) + 1;

    const dateKey = msg.date;
    messagesByDate[dateKey] = (messagesByDate[dateKey] || 0) + 1;

    const monthKey = `${msg.timestamp.getFullYear()}-${String(msg.timestamp.getMonth() + 1).padStart(2, '0')}`;
    messagesByMonth[monthKey] = (messagesByMonth[monthKey] || 0) + 1;

    // Words
    const words = msg.message.trim().split(/\s+/).filter(Boolean);
    wordsByUser[msg.sender] = (wordsByUser[msg.sender] || 0) + words.length;

    // Hour
    const hour = msg.timestamp.getHours();
    messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;

    // Day of week
    const day = DAYS[msg.timestamp.getDay()];
    messagesByDayOfWeek[day] = (messagesByDayOfWeek[day] || 0) + 1;

    // Emojis
    const emojis = msg.message.match(EMOJI_REGEX) || [];
    for (const e of emojis) {
      emojiCount[e] = (emojiCount[e] || 0) + 1;
    }

    // Media / link sharing
    if (MEDIA_REGEX.test(msg.message) || URL_REGEX.test(msg.message)) {
      mediaLinkSharer[msg.sender] = (mediaLinkSharer[msg.sender] || 0) + 1;
    }
  }

  const avgWordsPerMessage: Record<string, number> = {};
  for (const user of Object.keys(messagesByUser)) {
    avgWordsPerMessage[user] = Math.round((wordsByUser[user] || 0) / messagesByUser[user]);
  }

  const topEmojis = Object.entries(emojiCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emoji, count]) => ({ emoji, count }));

  return {
    totalMessages: messages.length,
    participants: Array.from(participantSet),
    messagesByUser,
    messagesByDate,
    messagesByMonth,
    wordsByUser,
    avgWordsPerMessage,
    messagesByHour,
    messagesByDayOfWeek,
    topEmojis,
    conversationStarters,
    mediaLinkSharer,
    doubleTexter,
  };
}
