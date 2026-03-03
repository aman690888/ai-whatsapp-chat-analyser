import { useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import type { ChatStats, ParsedMessage } from '@/lib/whatsapp-parser';

interface ChatLensWrappedProps {
  stats: ChatStats;
  messages: ParsedMessage[];
}

const EMOJI_REGEX = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

function getTopEmoji(messages: ParsedMessage[]): string {
  const counts: Record<string, number> = {};

  for (const msg of messages) {
    const emojis = msg.message.match(EMOJI_REGEX) || [];
    for (const emoji of emojis) {
      counts[emoji] = (counts[emoji] || 0) + 1;
    }
  }

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (${top[1]}x)` : 'No emoji detected';
}

function generateVibeRoast(stats: ChatStats): string {
  const topSender = Object.entries(stats.messagesByUser).sort((a, b) => b[1] - a[1])[0];
  const total = stats.totalMessages;

  if (!topSender) return 'Silent era unlocked. This chat has mysterious low-key energy.';

  const [name, count] = topSender;
  const share = total > 0 ? Math.round((count / total) * 100) : 0;

  if (share >= 60) {
    return `${name} is basically running a solo podcast in this chat. Main-character energy at ${share}% of all messages.`;
  }

  if (share >= 40) {
    return `Chaotic but iconic. ${name} leads the conversation, but the group still keeps the plot alive.`;
  }

  return 'Balanced and unhinged in the best way — this chat has elite group chemistry with everyone adding flavor.';
}

export function ChatLensWrapped({ stats, messages }: ChatLensWrappedProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const topSender = useMemo(() => {
    const sender = Object.entries(stats.messagesByUser).sort((a, b) => b[1] - a[1])[0];
    return sender ? `${sender[0]} (${sender[1].toLocaleString()})` : 'N/A';
  }, [stats.messagesByUser]);

  const topEmoji = useMemo(() => getTopEmoji(messages), [messages]);
  const vibeRoast = useMemo(() => generateVibeRoast(stats), [stats]);

  const downloadWrapped = async () => {
    if (!cardRef.current) return;

    const canvas = await html2canvas(cardRef.current, {
      useCORS: true,
      backgroundColor: null,
      scale: 2,
    });

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ChatLens-Wrapped.png';
    a.click();
  };

  return (
    <section className="card-dark-raised p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          ✨ ChatLens Wrapped
        </h2>
        <span className="text-xs md:text-sm px-3 py-1 rounded-full" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
          Shareable Story Card
        </span>
      </div>

      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="w-full max-w-[360px] rounded-[28px] p-6 md:p-7 text-white shadow-2xl"
          style={{
            aspectRatio: '9 / 16',
            background: 'linear-gradient(160deg, #ff2d55 0%, #ff8a00 45%, #6a5cff 100%)',
          }}
        >
          <div className="h-full flex flex-col">
            <p className="text-xs uppercase tracking-[0.22em] text-white/80">ChatLens Wrapped</p>
            <h3 className="text-3xl font-black mt-1">Your Chat Story</h3>

            <div className="mt-6 space-y-3 text-sm">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
                <p className="text-white/70 text-xs">Total Messages</p>
                <p className="text-xl font-bold">{stats.totalMessages.toLocaleString()}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
                <p className="text-white/70 text-xs">Top Sender</p>
                <p className="text-base font-semibold">{topSender}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
                <p className="text-white/70 text-xs">Top Emoji</p>
                <p className="text-base font-semibold">{topEmoji}</p>
              </div>
            </div>

            <div className="mt-5 bg-black/30 border border-white/20 rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-1">AI Relationship Vibe / Roast</p>
              <p className="text-sm md:text-base leading-relaxed font-medium">{vibeRoast}</p>
            </div>

            <p className="mt-auto text-[11px] text-white/75">Made with ChatLens • #ChatLensWrapped</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={downloadWrapped}
          className="gradient-red rounded-xl px-5 py-2.5 font-semibold text-sm"
          style={{ color: 'hsl(var(--primary-foreground))' }}
        >
          Download your Wrapped
        </button>
      </div>
    </section>
  );
}
