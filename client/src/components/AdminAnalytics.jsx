import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getAdminAnalytics } from '../api/admin';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const STATUS_COLORS = {
  pending: '#f59e0b', accepted: '#0ea5e9', completed: '#10b981', cancelled: '#f43f5e',
};
const PROVIDER_COLORS = { Approved: '#10b981', Pending: '#f59e0b' };
const BRAND = '#4f46e5';

const KPIS = [
  { key: 'users', label: 'Total Users' },
  { key: 'providers', label: 'Providers' },
  { key: 'customers', label: 'Customers' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'completed', label: 'Completed' },
  { key: 'reviews', label: 'Reviews' },
];

function ChartCard({ title, children, empty }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      {empty ? (
        <div className="h-[240px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          No data yet
        </div>
      ) : (
        <div className="h-[240px]">{children}</div>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true); setError(null);
    getAdminAnalytics()
      .then(setData)
      .catch(() => setError('Could not load analytics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!data) return null;

  // Theme-aware chart chrome
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${gridColor}`,
    borderRadius: 12,
    fontSize: 12,
    color: isDark ? '#e2e8f0' : '#0f172a',
  };

  const totalBookings = data.totals?.bookings || 0;
  const hasTimeData = data.bookings_over_time?.some((d) => d.count > 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map((k) => (
          <div key={k.key} className="card p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {data.totals?.[k.key] ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Bookings over time */}
      <ChartCard title="Bookings over time (last 6 months)" empty={!hasTimeData}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.bookings_over_time} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
                <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} stroke={gridColor} />
            <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 12 }} stroke={gridColor} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridColor }} />
            <Area type="monotone" dataKey="count" name="Bookings" stroke={BRAND} strokeWidth={2.5} fill="url(#bookingsFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top categories */}
        <ChartCard title="Top categories by bookings" empty={!data.top_categories?.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.top_categories} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: axisColor, fontSize: 12 }} stroke={gridColor} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fill: axisColor, fontSize: 12 }} stroke={gridColor} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#1e293b55' : '#f1f5f955' }} />
              <Bar dataKey="count" name="Bookings" fill={BRAND} radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bookings by status */}
        <ChartCard title="Bookings by status" empty={totalBookings === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.bookings_by_status}
                dataKey="count"
                nameKey="status"
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={85}
                paddingAngle={2}
              >
                {data.bookings_by_status?.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: axisColor, textTransform: 'capitalize' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Providers by status */}
      <ChartCard title="Providers by approval status" empty={!data.totals?.providers}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.providers_by_status}
              dataKey="count"
              nameKey="status"
              cx="50%" cy="50%"
              outerRadius={85}
              label={{ fill: axisColor, fontSize: 12 }}
            >
              {data.providers_by_status?.map((entry) => (
                <Cell key={entry.status} fill={PROVIDER_COLORS[entry.status] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
