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

  // Filter system messages
  return messages.filter(m =>
    m.sender !== 'You' || m.message.length > 0
  ).filter(m =>
    !m.message.includes('Messages and calls are end-to-end encrypted') &&
    !m.message.includes('Your security code with') &&
    !m.message.includes('changed their phone number') &&
    !m.message.includes('added') &&
    m.sender.length > 0
  );
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
