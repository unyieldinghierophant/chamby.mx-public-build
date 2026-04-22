import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { A, fmtMXN, dotColor, relativeTime, startOfWeek, startOfMonth } from '../adminTokens';
import { JobsTable } from '../components/JobsTable';

interface Stats {
  activeJobs: number;
  openDisputes: number;
  todayDisputes: number;
  weekCancellations: number;
  lateCancellations: number;
  gmvMonth: number;
}

interface ChartPoint { date: string; amount: number }
interface Activity { id: string; type: string; message: string; created_at: string }

type Period = '7d' | '30d' | 'month';

const card: React.CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 20 };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, fontFamily: A.fontSans, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };
const valueStyle: React.CSSProperties = { fontSize: 28, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary, lineHeight: 1 };

export function ResumenView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => { fetchStats(); fetchActivity(); }, []);
  useEffect(() => { fetchChart(period); }, [period]);

  const fetchStats = async () => {
    const weekStart = startOfWeek();
    const monthStart = startOfMonth();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);

    const [
      { count: activeJobs },
      { count: openDisputes },
      { count: todayDisputes },
      { count: weekCancellations },
      { count: lateCancellations },
      { data: payments },
    ] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true }).not('status', 'in', '("cancelled","completed","no_match")'),
      (supabase as any).from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      (supabase as any).from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open').gte('created_at', todayStart.toISOString()),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'cancelled').gte('updated_at', weekStart),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'cancelled').eq('late_cancellation_penalty_applied', true).gte('updated_at', weekStart),
      supabase.from('payments').select('amount, total_amount_cents').eq('status', 'succeeded').gte('created_at', monthStart),
    ]);

    const gmv = payments?.reduce((sum, p) => sum + (p.total_amount_cents ?? (p.amount ?? 0) * 100), 0) ?? 0;

    setStats({
      activeJobs: activeJobs ?? 0,
      openDisputes: openDisputes ?? 0,
      todayDisputes: todayDisputes ?? 0,
      weekCancellations: weekCancellations ?? 0,
      lateCancellations: lateCancellations ?? 0,
      gmvMonth: gmv,
    });
  };

  const fetchChart = async (p: Period) => {
    const daysBack = p === '7d' ? 7 : p === '30d' ? 30 : new Date().getDate();
    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    since.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('payments')
      .select('amount, total_amount_cents, created_at')
      .eq('status', 'succeeded')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    const byDay: Record<string, number> = {};
    data?.forEach(pay => {
      const day = pay.created_at.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + (pay.total_amount_cents ?? (pay.amount ?? 0) * 100);
    });

    const points: ChartPoint[] = [];
    for (let i = daysBack; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      points.push({ date: key.slice(5), amount: Math.round((byDay[key] ?? 0) / 100) });
    }
    setChart(points);
  };

  const fetchActivity = async () => {
    const { data } = await (supabase as any)
      .from('admin_notifications')
      .select('id, type, message, created_at')
      .order('created_at', { ascending: false })
      .limit(8);
    setActivity(data ?? []);
  };

  const statCard = (label: string, value: string | number, sub: string, valueColor?: string) => (
    <div style={card}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, color: valueColor ?? A.textPrimary }}>{value}</div>
      <div style={{ fontSize: 12, color: A.textTertiary, fontFamily: A.fontSans, marginTop: 6 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {statCard('Trabajos activos', stats?.activeJobs ?? '—', 'en la plataforma')}
        {statCard('Disputas abiertas', stats?.openDisputes ?? '—', `${stats?.todayDisputes ?? 0} sin revisar hoy`, stats?.openDisputes ? '#C4473A' : A.textPrimary)}
        {statCard('Cancelaciones', stats?.weekCancellations ?? '—', `esta semana — ${stats?.lateCancellations ?? 0} tardía(s)`, stats?.weekCancellations ? '#A67B1A' : A.textPrimary)}
        {statCard('GMV este mes', stats ? fmtMXN(stats.gmvMonth) : '—', 'pagos capturados')}
      </div>

      {/* Chart + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Chart */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary }}>Crecimiento de la plataforma</div>
            <select value={period} onChange={e => setPeriod(e.target.value as Period)}
              style={{ border: `1px solid ${A.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontFamily: A.fontSans, color: A.textPrimary, background: A.surface, cursor: 'pointer' }}>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="month">Este mes</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2B5A3D" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#2B5A3D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={A.border} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: A.fontMono, fill: A.textTertiary }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fontFamily: A.fontMono, fill: A.textTertiary }} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toLocaleString()}`} />
              <Tooltip contentStyle={{ fontFamily: A.fontSans, fontSize: 12, border: `1px solid ${A.border}`, borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()} MXN`, 'GMV']} />
              <Area type="monotone" dataKey="amount" stroke="#2B5A3D" strokeWidth={2} fill="url(#gmvGrad)" dot={false} activeDot={{ r: 4, fill: '#2B5A3D' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity feed */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary }}>Actividad reciente</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activity.length === 0
              ? <span style={{ fontSize: 13, color: A.textTertiary, fontFamily: A.fontSans }}>Sin actividad reciente</span>
              : activity.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(a.type), marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: A.textPrimary, fontFamily: A.fontSans, lineHeight: 1.4 }}>{a.message}</div>
                    <div style={{ fontSize: 11, color: A.textTertiary, fontFamily: A.fontMono, marginTop: 2 }}>{relativeTime(a.created_at)}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Jobs table */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary, marginBottom: 16 }}>Trabajos recientes</div>
        <JobsTable compact />
      </div>
    </div>
  );
}
