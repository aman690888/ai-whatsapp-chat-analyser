import { useMemo } from 'react';
import type { ChatStats } from '@/lib/whatsapp-parser';

interface VibeCheckCardProps {
  stats: ChatStats;
}

function buildVibe(stats: ChatStats): string {
  const topSender = Object.entries(stats.messagesByUser).sort((a, b) => b[1] - a[1])[0];

  if (!topSender || stats.totalMessages === 0) {
    return 'Quiet mode detected. This chat is currently low-volume and mysterious.';
  }

  const [name, count] = topSender;
  const share = Math.round((count / stats.totalMessages) * 100);
  const participants = stats.participants.length;

  if (share >= 60) {
    return `${name} is the main narrator of this chat (${share}% of all messages). Big monologue energy.`;
  }

  if (participants <= 2) {
    return `Private duo energy. ${name} leads the pace, but this is clearly a two-person storyline.`;
  }

  if (share >= 40) {
    return `Strong lead presence from ${name}, but the group still keeps the conversation balanced and lively.`;
  }

  return 'Healthy group dynamics: messages are spread across people, and the chat energy feels collaborative.';
}

export function VibeCheckCard({ stats }: VibeCheckCardProps) {
  const topSender = useMemo(() => {
    const sender = Object.entries(stats.messagesByUser).sort((a, b) => b[1] - a[1])[0];
    if (!sender) return 'N/A';
    return `${sender[0]} (${sender[1].toLocaleString()} messages)`;
  }, [stats.messagesByUser]);

  const vibeText = useMemo(() => buildVibe(stats), [stats]);

  return (
    <section className="card-dark-raised p-5 space-y-4 border" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            AI Chat Analysis
          </p>
          <h3 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Vibe Check
          </h3>
        </div>
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
          Auto-generated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl p-3 border" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--surface))' }}>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Messages</p>
          <p className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{stats.totalMessages.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-3 border" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--surface))' }}>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Top Sender</p>
          <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{topSender}</p>
        </div>
      </div>

      <div className="rounded-xl p-4 border" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Relationship Dynamic / Roast
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{vibeText}</p>
      </div>
    </section>
  );
}
