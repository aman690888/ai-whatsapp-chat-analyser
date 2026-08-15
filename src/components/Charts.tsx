import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area,
} from 'recharts';
import { motion } from 'framer-motion';
import type { ChatStats } from '@/lib/whatsapp-parser';

interface ChartsProps { stats: ChatStats; }

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(224 35% 8%)',
  border: '1px solid hsl(220 25% 22%)',
  borderRadius: '12px',
  color: 'hsl(210 20% 96%)',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.5)',
};

const TICK_STYLE = { fill: 'hsl(215 12% 42%)', fontSize: 11 };
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const inView = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { type: 'spring', bounce: 0, duration: 0.5 } } as const;

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div {...inView} className="glass-card p-5">
      <p className="label-caps mb-4">{title}</p>
      {children}
    </motion.div>
  );
}

export function MessagesPerUserChart({ stats }: ChartsProps) {
  const data = Object.entries(stats.messagesByUser)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, count]) => ({ name: name.split(' ')[0], count }));

  return (
    <ChartCard title="Messages Per Participant">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--accent) / 0.07)' }} />
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(150 65% 38%)" />
            </linearGradient>
          </defs>
          <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Messages" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ActivityOverTimeChart({ stats }: ChartsProps) {
  const data = Object.entries(stats.messagesByMonth)
    .sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
    .map(([month, count]) => ({ month: month.slice(0, 7), count }));

  return (
    <ChartCard title="Activity Over Time">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 25% 16%)" />
          <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line
            type="monotone" dataKey="count"
            stroke="hsl(var(--accent))" strokeWidth={2.5}
            dot={{ fill: 'hsl(var(--accent))', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'hsl(var(--accent))', strokeWidth: 0 }}
            name="Messages"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HourlyHeatmapChart({ stats }: ChartsProps) {
  const data = Array.from({ length: 24 }, (_, h) => ({
    hour: h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`,
    count: stats.messagesByHour[h] || 0,
  }));

  return (
    <ChartCard title="Messages by Hour">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 25% 16%)" />
          <XAxis dataKey="hour" tick={TICK_STYLE} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#hourGrad)" name="Messages" dot={false} activeDot={{ r: 4, fill: 'hsl(var(--accent))', strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DayOfWeekChart({ stats }: ChartsProps) {
  const data = DAY_ORDER.map(day => ({ day: day.slice(0, 3), count: stats.messagesByDayOfWeek[day] || 0 }));

  return (
    <ChartCard title="Messages by Day">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--accent) / 0.07)' }} />
          <defs>
            <linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(200 70% 58%)" />
              <stop offset="100%" stopColor="hsl(200 70% 38%)" />
            </linearGradient>
          </defs>
          <Bar dataKey="count" fill="url(#dayGrad)" radius={[6, 6, 0, 0]} name="Messages" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TopEmojisCard({ stats }: ChartsProps) {
  const { topEmojis } = stats;
  const COLORS = ['hsl(var(--accent))', 'hsl(200 70% 58%)', 'hsl(280 70% 65%)', 'hsl(38 90% 60%)', 'hsl(350 80% 65%)'];

  return (
    <ChartCard title="Top Emojis">
      {topEmojis.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'hsl(var(--text-tertiary))' }}>No emojis found in this chat.</p>
      ) : (
        <div className="flex items-end justify-around gap-2 pt-2 pb-1">
          {topEmojis.map(({ emoji, count }, i) => {
            const maxCount = topEmojis[0].count;
            const heightPct = 40 + (count / maxCount) * 60;
            return (
              <div key={emoji} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--text-tertiary))' }}>{count.toLocaleString()}</span>
                <motion.div
                  className="w-full rounded-t-xl flex items-center justify-center"
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}px` }}
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.6, delay: i * 0.07 }}
                  style={{ background: `${COLORS[i]}18`, border: `1px solid ${COLORS[i]}40` }}
                >
                  <span style={{ fontSize: `${20 + (4 - i) * 2.5}px` }}>{emoji}</span>
                </motion.div>
                <span className="text-xs font-bold badge-green">#{i + 1}</span>
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}

export function WordStatsCard({ stats }: ChartsProps) {
  const data = Object.entries(stats.wordsByUser)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, words]) => ({ name: name.split(' ')[0], words, avg: stats.avgWordsPerMessage[name] || 0 }));

  return (
    <ChartCard title="Word Count & Avg Length">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--accent) / 0.07)' }} formatter={(value, name) => [value, name === 'words' ? 'Total Words' : 'Avg Words/Msg']} />
          <defs>
            <linearGradient id="wordGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(280 70% 65%)" />
              <stop offset="100%" stopColor="hsl(280 65% 45%)" />
            </linearGradient>
          </defs>
          <Bar dataKey="words" fill="url(#wordGrad)" radius={[6, 6, 0, 0]} name="words" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.slice(0, 5).map(({ name, avg }) => (
          <div key={name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs glass-card" style={{ borderRadius: '999px' }}>
            <span style={{ color: 'hsl(var(--text-primary))' }}>{name}</span>
            <span style={{ color: 'hsl(var(--text-tertiary))' }}>~{avg} w/msg</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
