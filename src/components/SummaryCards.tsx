import type { ChatStats } from '@/lib/whatsapp-parser';
import { MessageSquare, Users, TrendingUp, Calendar } from 'lucide-react';

const STAT_COLORS = ['hsl(0 85% 50%)', 'hsl(0 70% 40%)', 'hsl(0 60% 35%)', 'hsl(0 50% 30%)'];

export function getColor(index: number): string {
  return STAT_COLORS[index % STAT_COLORS.length];
}

interface SummaryCardsProps {
  stats: ChatStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const topSender = Object.entries(stats.messagesByUser).sort((a, b) => b[1] - a[1])[0];
  const activeDays = Object.keys(stats.messagesByDate).length;

  const cards = [
    { icon: MessageSquare, label: 'Total Messages', value: stats.totalMessages.toLocaleString(), sub: 'across all time' },
    { icon: Users, label: 'Participants', value: stats.participants.length, sub: stats.participants.slice(0, 2).join(', ') + (stats.participants.length > 2 ? '...' : '') },
    { icon: TrendingUp, label: 'Top Sender', value: topSender?.[0] || 'N/A', sub: `${topSender?.[1] || 0} messages` },
    { icon: Calendar, label: 'Active Days', value: activeDays, sub: 'days with activity' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div key={c.label} className="card-dark-raised p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.label}</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${STAT_COLORS[i]}22` }}>
              <c.icon className="w-4 h-4" style={{ color: STAT_COLORS[i] }} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>{c.value}</p>
            <p className="text-xs truncate mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
