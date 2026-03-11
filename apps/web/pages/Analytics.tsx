import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BarChart3, TrendingUp, Users, Eye,
  ArrowUpRight, ArrowDownRight, Globe, MousePointer2,
  Monitor, Smartphone, Tablet, Clock, ChevronDown, Loader2,
} from 'lucide-react';
import { useAuthStore } from '../src/stores/authStore';
import { fetchProfiles } from '../src/lib/profileApi';
import {
  fetchAnalyticsOverview,
  fetchTimeseries,
  fetchReferrers,
  fetchDevices,
  fetchLinkStats,
} from '../src/lib/analyticsApi';
import type {
  AnalyticsOverview,
  TimeseriesPoint,
  ReferrerStat,
  DeviceStat,
  BrowserStat,
  LinkStat,
  AnalyticsPeriod,
  ApiProfile,
} from '@tap/shared';

// ── Period selector options ───────────────────────────────────────

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];

// ── Mini bar chart (pure CSS) ─────────────────────────────────────

function MiniBarChart({ data, dataKey, color }: {
  data: TimeseriesPoint[];
  dataKey: 'views' | 'clicks' | 'visitors';
  color: string;
}) {
  const max = Math.max(...data.map((d) => d[dataKey]), 1);

  return (
    <div className="flex items-end gap-[2px] h-36 w-full">
      {data.map((d, i) => {
        const h = (d[dataKey] / max) * 100;
        return (
          <div
            key={i}
            className="flex-1 min-w-0 rounded-t transition-all duration-200 hover:opacity-80 group relative"
            style={{ height: `${Math.max(h, 2)}%`, backgroundColor: color }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-ink text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
              {d.date}: {d[dataKey].toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut chart (SVG) ─────────────────────────────────────────────

function DonutChart({ items, colors }: {
  items: { label: string; value: number }[];
  colors: string[];
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) {
    return (
      <div className="w-32 h-32 rounded-full border-8 border-slate-100 mx-auto flex items-center justify-center">
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="128" height="128" viewBox="0 0 100 100" role="img" aria-label={`Chart: ${items.map(i => `${i.label} ${Math.round((i.value / total) * 100)}%`).join(', ')}`}>
        {items.map((item, i) => {
          const pct = item.value / total;
          const dashLength = pct * circumference;
          const currentOffset = offset;
          offset += pct;
          return (
            <circle
              key={i}
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="16"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-currentOffset * circumference}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 justify-center">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────

function StatCard({ label, value, change, icon: Icon, color, delay }: {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) {
  const isPositive = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay || 0 }}
      className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 ${color}`}>
          <Icon size={18} />
        </div>
        {change !== 0 && (
          <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{change}%
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </div>
        )}
      </div>
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{label}</h3>
      <p className="text-2xl font-bold text-ink dark:text-white">{value}</p>
    </motion.div>
  );
}

// ── Format helpers ────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function fmtTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ── Main component ────────────────────────────────────────────────

const DONUT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [profiles, setProfiles] = useState<ApiProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [referrers, setReferrers] = useState<ReferrerStat[]>([]);
  const [deviceData, setDeviceData] = useState<{
    devices: DeviceStat[];
    browsers: BrowserStat[];
  } | null>(null);
  const [linkStats, setLinkStats] = useState<LinkStat[]>([]);
  const [chartMode, setChartMode] = useState<'views' | 'clicks' | 'visitors'>('views');
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load profiles
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchProfiles().then(({ profiles: p }) => {
      setProfiles(p);
      if (p.length > 0) setActiveProfileId(p[0].id);
    }).catch(() => {});
  }, [isAuthenticated]);

  // Load analytics data
  useEffect(() => {
    if (!activeProfileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    Promise.all([
      fetchAnalyticsOverview(activeProfileId, period),
      fetchTimeseries(activeProfileId, period),
      fetchReferrers(activeProfileId, period),
      fetchDevices(activeProfileId, period),
      fetchLinkStats(activeProfileId, period),
    ]).then(([ov, ts, ref, dev, lnk]) => {
      setOverview(ov.overview);
      setTimeseries(ts.timeseries);
      setReferrers(ref.referrers);
      setDeviceData({ devices: dev.devices, browsers: dev.browsers });
      setLinkStats(lnk.links);
      setError(null);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    }).finally(() => setLoading(false));
  }, [activeProfileId, period, retryKey]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black pt-20 sm:pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-ink dark:text-white mb-1">Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Track your page performance in real time.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {profiles.length > 1 && (
              <div className="relative">
                <select
                  value={activeProfileId || ''}
                  onChange={(e) => setActiveProfileId(e.target.value)}
                  className="appearance-none pl-4 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-jam-red/20"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName || p.username}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
                className="appearance-none pl-4 pr-8 py-2 bg-ink text-white rounded-lg text-sm font-medium cursor-pointer focus:outline-none"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Empty state */}
        {!activeProfileId && !loading && (
          <div className="text-center py-24">
            <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-ink mb-2">No analytics yet</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create a profile and share it to start tracking views, clicks, and audience growth.</p>
            <button
              onClick={() => navigate('/dashboard/links')}
              className="px-6 py-2.5 bg-jam-red text-white rounded-full text-sm font-medium hover:bg-jam-red/90 transition-colors"
            >
              Create Your Page
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-200" />
                    <div className="w-12 h-4 rounded bg-slate-100" />
                  </div>
                  <div className="h-4 w-20 rounded bg-slate-200 mb-2" />
                  <div className="h-7 w-16 rounded bg-slate-200" />
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 animate-pulse">
              <div className="h-5 w-40 rounded bg-slate-200 mb-6" />
              <div className="h-36 w-full rounded bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse">
                  <div className="h-5 w-32 rounded bg-slate-200 mb-4" />
                  <div className="space-y-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-3 rounded bg-slate-100" style={{ width: `${90 - j * 15}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-24">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => { setError(null); setRetryKey((k) => k + 1); }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dashboard */}
        {!loading && !error && overview && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Page Views" value={fmt(overview.views)} change={overview.viewsChange} icon={Eye} color="text-blue-600" delay={0} />
              <StatCard label="Unique Visitors" value={fmt(overview.uniqueVisitors)} change={overview.visitorsChange} icon={Users} color="text-purple-600" delay={0.05} />
              <StatCard label="Link Clicks" value={fmt(overview.clicks)} change={overview.clicksChange} icon={MousePointer2} color="text-green-600" delay={0.1} />
              <StatCard label="Click-Through Rate" value={`${overview.ctr}%`} change={0} icon={TrendingUp} color="text-amber-600" delay={0.15} />
            </div>

            {/* Engagement metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock size={22} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg. Time on Page</p>
                  <p className="text-xl font-bold text-ink dark:text-white">{fmtTime(overview.avgTimeOnPage)}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <BarChart3 size={22} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg. Scroll Depth</p>
                  <p className="text-xl font-bold text-ink dark:text-white">{overview.avgScrollDepth}%</p>
                </div>
              </div>
            </div>

            {/* Timeseries Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <h3 className="text-base sm:text-lg font-bold text-ink dark:text-white">Traffic Over Time</h3>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5" role="tablist" aria-label="Chart metric">
                  {(['views', 'visitors', 'clicks'] as const).map((mode) => (
                    <button
                      key={mode}
                      role="tab"
                      aria-selected={chartMode === mode}
                      onClick={() => setChartMode(mode)}
                      className={`px-3 py-2 text-xs font-medium rounded-md transition-colors min-h-[44px] ${
                        chartMode === mode ? 'bg-white dark:bg-slate-700 text-ink dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {timeseries.length > 0 ? (
                <>
                  <MiniBarChart
                    data={timeseries}
                    dataKey={chartMode}
                    color={chartMode === 'views' ? '#6366f1' : chartMode === 'visitors' ? '#8b5cf6' : '#10b981'}
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                    <span>{timeseries[0]?.date}</span>
                    <span>{timeseries[timeseries.length - 1]?.date}</span>
                  </div>
                </>
              ) : (
                <div className="h-36 flex items-center justify-center text-slate-400 text-sm">
                  No data for this period
                </div>
              )}
            </div>

            {/* Three-column row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Top Referrers */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" /> Top Referrers
                </h3>
                {referrers.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">No referrer data yet</p>
                ) : (
                  <div className="space-y-3">
                    {referrers.slice(0, 8).map((r, i) => {
                      const maxCount = referrers[0]?.count || 1;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={r.source === 'Direct' ? 'Direct / None' : r.source}>
                              {r.source === 'Direct' ? 'Direct / None' : r.source}
                            </span>
                            <span className="text-xs font-bold text-slate-500">{r.count}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${(r.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Device Breakdown */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
                  <Smartphone size={18} className="text-purple-500" /> Devices
                </h3>
                {deviceData && deviceData.devices.length > 0 ? (
                  <DonutChart
                    items={deviceData.devices.map((d) => ({
                      label: d.type.charAt(0).toUpperCase() + d.type.slice(1),
                      value: d.count,
                    }))}
                    colors={DONUT_COLORS}
                  />
                ) : (
                  <p className="text-sm text-slate-400 py-8 text-center">No device data yet</p>
                )}
              </div>

              {/* Browsers */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
                  <Monitor size={18} className="text-indigo-500" /> Browsers
                </h3>
                {deviceData && deviceData.browsers.length > 0 ? (
                  <div className="space-y-3">
                    {deviceData.browsers.slice(0, 6).map((b, i) => {
                      const maxCount = deviceData.browsers[0]?.count || 1;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-700 dark:text-slate-300">{b.name}</span>
                            <span className="text-xs font-bold text-slate-500">{b.count}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                              style={{ width: `${(b.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-8 text-center">No browser data yet</p>
                )}
              </div>
            </div>

            {/* Link Performance */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
                <MousePointer2 size={18} className="text-emerald-500" /> Link Performance
              </h3>
              {linkStats.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No click data yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {linkStats.map((link) => {
                    const maxClicks = linkStats[0]?.clicks || 1;
                    const ratio = link.clicks / maxClicks;
                    const heat =
                      ratio > 0.7 ? 'bg-red-500' :
                      ratio > 0.4 ? 'bg-orange-400' :
                      ratio > 0.15 ? 'bg-yellow-300' :
                      'bg-slate-200';
                    return (
                      <div
                        key={link.linkId}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${heat}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={link.label}>{link.label}</p>
                            <p className="text-[10px] text-slate-400 truncate">{link.type}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 flex-shrink-0 ml-2">
                          {link.clicks.toLocaleString()} click{link.clicks !== 1 ? 's' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
