import type { ChatStats } from '@/lib/whatsapp-parser';
import { MessageSquare, Users, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const CARDS = [
  { icon: MessageSquare, label: 'Total Messages', color: 'hsl(var(--accent))', bg: 'hsl(var(--accent) / 0.12)' },
  { icon: Users,        label: 'Participants',    color: 'hsl(200 70% 58%)', bg: 'hsl(200 70% 50% / 0.12)' },
  { icon: TrendingUp,   label: 'Top Sender',      color: 'hsl(280 70% 65%)', bg: 'hsl(280 70% 55% / 0.12)' },
  { icon: Calendar,     label: 'Active Days',     color: 'hsl(38 90% 60%)',  bg: 'hsl(38 90% 50% / 0.12)' },
];

export function getColor(index: number): string {
  return CARDS[index % CARDS.length].color;
}

interface SummaryCardsProps { stats: ChatStats; }

export function SummaryCards({ stats }: SummaryCardsProps) {
  const topSender = Object.entries(stats.messagesByUser).sort((a, b) => b[1] - a[1])[0];
  const activeDays = Object.keys(stats.messagesByDate).length;

  const values = [
    { value: stats.totalMessages.toLocaleString(), sub: 'across all time' },
    { value: stats.participants.length, sub: stats.participants.slice(0, 2).join(', ') + (stats.participants.length > 2 ? '…' : '') },
    { value: topSender?.[0] || 'N/A', sub: `${(topSender?.[1] || 0).toLocaleString()} messages` },
    { value: activeDays, sub: 'days with messages' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.45, delay: i * 0.06 }}
          className="glass-card p-5 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <p className="label-caps">{c.label}</p>
            <div className="icon-badge w-8 h-8 rounded-xl" style={{ background: c.bg }}>
              <c.icon className="w-4 h-4" style={{ color: c.color }} />
            </div>
          </div>
          <div>
            <p className="stat-value truncate">{values[i].value}</p>
            <p className="text-xs mt-1.5 truncate" style={{ color: 'hsl(var(--text-tertiary))' }}>{values[i].sub}</p>
          </div>
          {/* Subtle bottom accent line */}
          <div className="h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${c.color}, transparent)`, opacity: 0.4 }} />
        </motion.div>
      ))}
    </div>
  );
}
