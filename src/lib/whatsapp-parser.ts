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
}

// Matches: DD/MM/YYYY, HH:MM - Sender: Message
// Also handles MM/DD/YY format
const MSG_LINE_REGEX = /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\s*[-–]\s*([^:]+?):\s*(.*)/;

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
      // Try to parse date
      const parts = dateStr.split(/[\/\-\.]/);
      let dateObj: Date;
      try {
        // Try DD/MM/YYYY then MM/DD/YY
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
      // Multi-line continuation
      current.message += '\n' + line.trim();
    }
  }
  if (current) messages.push(current);

  // System message patterns — WhatsApp injects these with no real sender
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
    /^\+?\d[\d\s\-()]{6,}$/.test(sender) && sender.length < 5; // bare number fragments

  return messages.filter(m => {
    if (isSystemSender(m.sender)) return false;
    if (SYSTEM_PATTERNS.some(p => p.test(m.message))) return false;
    // Senders that are purely phone numbers with no name are typically system entries
    if (/^[\u200e\u200f\u202a-\u202e]/.test(m.sender)) return false;
    return true;
  });
}

export function computeStats(messages: ParsedMessage[]): ChatStats {
  const messagesByUser: Record<string, number> = {};
  const messagesByDate: Record<string, number> = {};
  const messagesByMonth: Record<string, number> = {};
  const participantSet = new Set<string>();

  for (const msg of messages) {
    participantSet.add(msg.sender);
    messagesByUser[msg.sender] = (messagesByUser[msg.sender] || 0) + 1;

    const dateKey = msg.date;
    messagesByDate[dateKey] = (messagesByDate[dateKey] || 0) + 1;

    const monthKey = `${msg.timestamp.getFullYear()}-${String(msg.timestamp.getMonth() + 1).padStart(2, '0')}`;
    messagesByMonth[monthKey] = (messagesByMonth[monthKey] || 0) + 1;
  }

  return {
    totalMessages: messages.length,
    participants: Array.from(participantSet),
    messagesByUser,
    messagesByDate,
    messagesByMonth,
  };
}
