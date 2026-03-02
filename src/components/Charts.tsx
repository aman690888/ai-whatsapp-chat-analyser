import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area,
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
  fontSize: 12,
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

export function HourlyHeatmapChart({ stats }: ChartsProps) {
  const data = Array.from({ length: 24 }, (_, h) => ({
    hour: h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`,
    count: stats.messagesByHour[h] || 0,
  }));

  return (
    <div className="card-dark-raised p-5">
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Messages by Hour of Day
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 85% 50%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(0 85% 50%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" />
          <XAxis dataKey="hour" tick={{ fill: 'hsl(0 0% 50%)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fill: 'hsl(0 0% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="hsl(0 85% 50%)"
            strokeWidth={2}
            fill="url(#hourGrad)"
            name="Messages"
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(0 85% 50%)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DayOfWeekChart({ stats }: ChartsProps) {
  const data = DAY_ORDER.map(day => ({
    day: day.slice(0, 3),
    count: stats.messagesByDayOfWeek[day] || 0,
  }));

  return (
    <div className="card-dark-raised p-5">
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Messages by Day of Week
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(0 85% 50% / 0.05)' }} />
          <Bar dataKey="count" fill="hsl(0 70% 40%)" radius={[4, 4, 0, 0]} name="Messages" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopEmojisCard({ stats }: ChartsProps) {
  const { topEmojis } = stats;

  return (
    <div className="card-dark-raised p-5">
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Top Emojis
      </h3>
      {topEmojis.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>No emojis found in this chat.</p>
      ) : (
        <div className="flex items-end justify-around gap-2 pt-2 pb-1">
          {topEmojis.map(({ emoji, count }, i) => {
            const maxCount = topEmojis[0].count;
            const heightPct = 40 + (count / maxCount) * 60;
            return (
              <div key={emoji} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {count.toLocaleString()}
                </span>
                <div
                  className="w-full rounded-t-lg flex items-center justify-center transition-all"
                  style={{
                    height: `${heightPct}px`,
                    background: `hsl(0 ${85 - i * 12}% ${45 + i * 5}% / 0.25)`,
                    border: `1px solid hsl(0 ${85 - i * 12}% ${45 + i * 5}% / 0.4)`,
                  }}
                >
                  <span style={{ fontSize: `${20 + (4 - i) * 3}px` }}>{emoji}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  #{i + 1}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WordStatsCard({ stats }: ChartsProps) {
  const data = Object.entries(stats.wordsByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, words]) => ({
      name: name.split(' ')[0],
      words,
      avg: stats.avgWordsPerMessage[name] || 0,
    }));

  return (
    <div className="card-dark-raised p-5">
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Word Count & Avg Length
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'hsl(0 85% 50% / 0.05)' }}
            formatter={(value, name) => [value, name === 'words' ? 'Total Words' : 'Avg Words/Msg']}
          />
          <Bar dataKey="words" fill="hsl(0 60% 45%)" radius={[4, 4, 0, 0]} name="words" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.slice(0, 5).map(({ name, avg }) => (
          <div
            key={name}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
          >
            <span style={{ color: 'hsl(var(--foreground))' }}>{name}</span>
            <span>~{avg} w/msg</span>
          </div>
        ))}
      </div>
    </div>
  );
}
