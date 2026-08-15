import type { ChatStats } from '@/lib/whatsapp-parser';
import { MessageCircle, Share2, Repeat2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props { stats: ChatStats; }

function topEntry(record: Record<string, number>): [string, number] | null {
  const entries = Object.entries(record);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0];
}
function shortName(name: string) { return name.split(' ')[0]; }

interface CardConfig {
  icon: React.ElementType;
  title: string;
  badge: string;
  winner: string;
  winnerCount: string;
  runners: { name: string; count: number }[];
  color: string;
  bg: string;
  index: number;
}

function BehaviorCard({ icon: Icon, title, badge, winner, winnerCount, runners, color, bg, index }: CardConfig) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.45, delay: 0.1 + index * 0.07 }}
      className="glass-card p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="icon-badge w-9 h-9 rounded-xl" style={{ background: bg }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <p className="label-caps">{title}</p>
          <p className="text-xs mt-0.5" style={{ color }}>{badge}</p>
        </div>
      </div>

      {/* Winner */}
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold truncate" style={{ color: 'hsl(var(--text-primary))', letterSpacing: '-0.03em' }}>
          {winner}
        </p>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: bg, color }}>
          {winnerCount}
        </span>
      </div>

      {/* Runner-up bars */}
      {runners.length > 0 && (
        <div className="space-y-2.5">
          {runners.map(({ name, count }, i) => {
            const pct = runners[0].count > 0 ? Math.round((count / runners[0].count) * 100) : 0;
            return (
              <div key={name} className="space-y-1">
                <div className="flex justify-between text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  <span>{shortName(name)}</span>
                  <span>{count.toLocaleString()}</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.7, delay: 0.2 + i * 0.08 }}
                    style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
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
  const starterTop  = topEntry(stats.conversationStarters);
  const starterRuns = Object.entries(stats.conversationStarters).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,count])=>({name,count}));
  const mediaTop    = topEntry(stats.mediaLinkSharer);
  const mediaRuns   = Object.entries(stats.mediaLinkSharer).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,count])=>({name,count}));
  const dtTop       = topEntry(stats.doubleTexter);
  const dtRuns      = Object.entries(stats.doubleTexter).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,count])=>({name,count}));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <BehaviorCard index={0} icon={MessageCircle} title="Conversation Starter" badge="Most new convos opened"
        winner={starterTop ? shortName(starterTop[0]) : 'N/A'} winnerCount={starterTop ? `${starterTop[1]}×` : '—'}
        runners={starterRuns} color="hsl(var(--accent))" bg="hsl(var(--accent) / 0.12)"
      />
      <BehaviorCard index={1} icon={Share2} title="Media & Link Sharer" badge="Most media & links sent"
        winner={mediaTop ? shortName(mediaTop[0]) : 'N/A'} winnerCount={mediaTop ? `${mediaTop[1]}×` : '—'}
        runners={mediaRuns} color="hsl(200 70% 58%)" bg="hsl(200 70% 50% / 0.12)"
      />
      <BehaviorCard index={2} icon={Repeat2} title="Double-Texter" badge="Most 3+ consecutive msgs"
        winner={dtTop ? shortName(dtTop[0]) : 'N/A'} winnerCount={dtTop ? `${dtTop[1]}×` : '—'}
        runners={dtRuns} color="hsl(38 90% 60%)" bg="hsl(38 90% 50% / 0.12)"
      />
    </div>
  );
}
