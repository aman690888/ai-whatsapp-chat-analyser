import type { ChatStats } from '@/lib/whatsapp-parser';
import { MessageCircle, Share2, Repeat2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  stats: ChatStats;
}

function topEntry(record: Record<string, number>): [string, number] | null {
  const entries = Object.entries(record);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0];
}

function shortName(name: string) {
  return name.split(' ')[0];
}

interface BehaviorCardProps {
  icon: React.ElementType;
  title: string;
  badge: string;
  winner: string;
  winnerCount: string;
  runners: { name: string; count: number }[];
  accentVar: string;
  index: number;
}

function BehaviorCard({ icon: Icon, title, badge, winner, winnerCount, runners, accentVar, index }: BehaviorCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: 0.1 + index * 0.05 }}
      className="card-dark-raised p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `hsl(${accentVar} / 0.15)` }}
        >
          <Icon className="w-4 h-4" style={{ color: `hsl(${accentVar})` }} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: `hsl(${accentVar})` }}>{badge}</p>
        </div>
      </div>

      {/* Winner */}
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>
          {winner}
        </p>
        <span
          className="text-sm font-semibold px-2.5 py-0.5 rounded-full shrink-0"
          style={{ background: `hsl(${accentVar} / 0.15)`, color: `hsl(${accentVar})` }}
        >
          {winnerCount}
        </span>
      </div>

      {/* Runner‑up bar list */}
      {runners.length > 0 && (
        <div className="space-y-2">
          {runners.map(({ name, count }, i) => {
            const maxCount = runners[0].count;
            const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
            return (
              <div key={name} className="space-y-1">
                <div className="flex justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span>{shortName(name)}</span>
                  <span>{count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: `hsl(${accentVar} / ${0.9 - i * 0.2})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export function BehaviorCards({ stats }: Props) {
  // Conversation Starter
  const starterTop = topEntry(stats.conversationStarters);
  const starterRunners = Object.entries(stats.conversationStarters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  // Media / Link Sharer
  const mediaTop = topEntry(stats.mediaLinkSharer);
  const mediaRunners = Object.entries(stats.mediaLinkSharer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  // Double Texter
  const dtTop = topEntry(stats.doubleTexter);
  const dtRunners = Object.entries(stats.doubleTexter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BehaviorCard
        index={0}
        icon={MessageCircle}
        title="Conversation Starter"
        badge="Most new convos opened"
        winner={starterTop ? shortName(starterTop[0]) : 'N/A'}
        winnerCount={starterTop ? `${starterTop[1]}x` : '—'}
        runners={starterRunners}
        accentVar="var(--primary)"
      />
      <BehaviorCard
        index={1}
        icon={Share2}
        title="Media & Link Sharer"
        badge="Most media & links sent"
        winner={mediaTop ? shortName(mediaTop[0]) : 'N/A'}
        winnerCount={mediaTop ? `${mediaTop[1]}x` : '—'}
        runners={mediaRunners}
        accentVar="210 85% 55%"
      />
      <BehaviorCard
        index={2}
        icon={Repeat2}
        title="Double-Texter"
        badge="Most 3+ consecutive msgs"
        winner={dtTop ? shortName(dtTop[0]) : 'N/A'}
        winnerCount={dtTop ? `${dtTop[1]}x` : '—'}
        runners={dtRunners}
        accentVar="45 90% 55%"
      />
    </div>
  );
}
