import { describe, it, expect } from 'vitest';
import { parseDateTime, parseWhatsAppChat, computeStats } from '../lib/whatsapp-parser';

describe('whatsapp-parser', () => {
  describe('parseDateTime', () => {
    it('parses 24-hour time accurately', () => {
      const d = parseDateTime('14/08/2024', '15:45');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(7); // August (0-indexed)
      expect(d.getDate()).toBe(14);
      expect(d.getHours()).toBe(15);
      expect(d.getMinutes()).toBe(45);
    });

    it('parses 12-hour PM time correctly', () => {
      const d = parseDateTime('14/08/2024', '03:45 PM');
      expect(d.getHours()).toBe(15);
      expect(d.getMinutes()).toBe(45);
    });

    it('parses 12-hour AM midnight correctly', () => {
      const d = parseDateTime('14/08/2024', '12:15 AM');
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(15);
    });

    it('parses 12-hour PM noon correctly', () => {
      const d = parseDateTime('14/08/2024', '12:15 PM');
      expect(d.getHours()).toBe(12);
      expect(d.getMinutes()).toBe(15);
    });

    it('handles 2-digit years and US format heuristic', () => {
      const d = parseDateTime('08/14/24', '10:00');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(7);
      expect(d.getDate()).toBe(14);
      expect(d.getHours()).toBe(10);
    });
  });

  describe('parseWhatsAppChat', () => {
    it('parses standard messages and filters system messages', () => {
      const rawChat = `14/08/2024, 10:00 - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
14/08/2024, 10:05 - Alice: Hey Bob! Are you ready for lunch? 😊
14/08/2024, 10:06 - Bob: Yes, pizza sounds great! 🍕
14/08/2024, 10:07 - Alice: Awesome.
Let's meet at 12:30.
14/08/2024, 10:08 - Bob: <Media omitted>`;

      const parsed = parseWhatsAppChat(rawChat);
      expect(parsed).toHaveLength(3); // system msg and <Media omitted> filtered

      expect(parsed[0].sender).toBe('Alice');
      expect(parsed[0].message).toBe('Hey Bob! Are you ready for lunch? 😊');
      expect(parsed[0].timestamp.getHours()).toBe(10);

      expect(parsed[1].sender).toBe('Bob');
      expect(parsed[1].message).toBe('Yes, pizza sounds great! 🍕');

      // Multiline test
      expect(parsed[2].sender).toBe('Alice');
      expect(parsed[2].message).toBe("Awesome.\nLet's meet at 12:30.");
    });
  });

  describe('computeStats', () => {
    it('computes accurate counts, hourly distribution, and behavioral metrics', () => {
      const rawChat = `14/08/2024, 09:00 - Alice: Good morning!
14/08/2024, 09:01 - Alice: Are you awake?
14/08/2024, 09:02 - Alice: Guess not! 😂
14/08/2024, 20:00 - Bob: Sorry, busy morning! 🚀
14/08/2024, 20:05 - Bob: Check this https://example.com`;

      const parsed = parseWhatsAppChat(rawChat);
      const stats = computeStats(parsed);

      expect(stats.totalMessages).toBe(5);
      expect(stats.participants).toEqual(['Alice', 'Bob']);
      expect(stats.messagesByUser['Alice']).toBe(3);
      expect(stats.messagesByUser['Bob']).toBe(2);

      // Hourly check: Hour 9 has 3 messages, Hour 20 has 2 messages
      expect(stats.messagesByHour[9]).toBe(3);
      expect(stats.messagesByHour[20]).toBe(2);
      expect(stats.messagesByHour[0]).toBe(0);

      // Emojis check
      expect(stats.topEmojis.find(e => e.emoji === '😂')?.count).toBe(1);
      expect(stats.topEmojis.find(e => e.emoji === '🚀')?.count).toBe(1);

      // Double texter (Alice sent 3 consecutive messages)
      expect(stats.doubleTexter['Alice']).toBe(1);

      // Conversation starters (>8 hour gap: 09:02 to 20:00 is ~11 hours)
      expect(stats.conversationStarters['Alice']).toBe(1); // 1st message of chat
      expect(stats.conversationStarters['Bob']).toBe(1); // Gap > 8h

      // Media / link sharer
      expect(stats.mediaLinkSharer['Bob']).toBe(1);
    });
  });
});
