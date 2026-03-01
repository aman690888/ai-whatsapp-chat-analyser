import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import type { ChatStats } from '@/lib/whatsapp-parser';

interface ChartsProps {
  stats: ChatStats;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(0 0% 10%)',
  border: '1px solid hsl(0 85% 50% / 0.3)',
  borderRadius: '8px',
  color: 'hsl(0 0% 95%)',
};

export function MessagesPerUserChart({ stats }: ChartsProps) {
  const data = Object.entries(stats.messagesByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name: name.split(' ')[0], count }));

  return (
    <div className="card-dark-raised p-5">
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Messages Per Participant
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(0 85% 50% / 0.05)' }} />
          <Bar dataKey="count" fill="hsl(0 85% 50%)" radius={[4, 4, 0, 0]} name="Messages" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActivityOverTimeChart({ stats }: ChartsProps) {
  const data = Object.entries(stats.messagesByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => ({ month: month.slice(0, 7), count }));

  return (
    <div className="card-dark-raised p-5">
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Activity Over Time
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
          <XAxis dataKey="month" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="hsl(0 85% 50%)"
            strokeWidth={2}
            dot={{ fill: 'hsl(0 85% 50%)', r: 3 }}
            activeDot={{ r: 5 }}
            name="Messages"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
