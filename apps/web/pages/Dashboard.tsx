import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Eye,
  MousePointerClick,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Link2,
  BarChart3,
  Plus,
  ExternalLink,
  Palette,
} from 'lucide-react';
import { toast } from '../src/stores/toastStore';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import { fetchAnalyticsOverview } from '../src/lib/analyticsApi';
import { fetchAudienceOverview } from '../src/lib/audienceApi';
import type { ApiProfile, AnalyticsOverview, AudienceOverview } from '@tap/shared';

interface DashboardContext {
  profiles: ApiProfile[];
  activeProfile: ApiProfile | undefined;
}

const Dashboard: React.FC = () => {
  const { activeProfile } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [audience, setAudience] = useState<AudienceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const [analyticsData, audienceData] = await Promise.all([
        fetchAnalyticsOverview(activeProfile.id, '30d').catch(() => null),
        fetchAudienceOverview(activeProfile.id).catch(() => null),
      ]);
      if (analyticsData) setAnalytics(analyticsData.overview);
      if (audienceData) setAudience(audienceData);
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Link2 size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-ink dark:text-white mb-2">Welcome to Tap</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          Create your first profile to start building your link-in-bio page.
        </p>
        <button
          onClick={() => navigate('/dashboard/links')}
          className="px-6 py-2.5 bg-jam-red text-white rounded-full font-medium hover:bg-red-700 transition-colors mb-6"
        >
          Create Profile
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full text-left">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-ink dark:text-white mb-1">1. Build</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Add your links, socials, and content blocks</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-ink dark:text-white mb-1">2. Customize</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Choose a theme, fonts, and button styles</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-ink dark:text-white mb-1">3. Share</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Publish and share your unique link everywhere</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = useMemo(() => [
    {
      label: 'Page Views',
      value: analytics?.views ?? 0,
      change: analytics?.viewsChange ?? 0,
      icon: Eye,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Link Clicks',
      value: analytics?.clicks ?? 0,
      change: analytics?.clicksChange ?? 0,
      icon: MousePointerClick,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Contacts',
      value: audience?.totalContacts ?? 0,
      change: audience?.contactsChange ?? 0,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Click Rate',
      value: analytics?.ctr ?? 0,
      change: 0,
      icon: TrendingUp,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      isPercent: true,
    },
  ], [analytics, audience]);

  const quickActions = useMemo(() => [
    { label: 'Add Link', icon: Plus, path: '/dashboard/links', color: 'bg-jam-red text-white' },
    { label: 'View Analytics', icon: BarChart3, path: '/dashboard/analytics', color: 'bg-blue-500 text-white' },
    { label: 'Edit Appearance', icon: Palette, path: '/dashboard/appearance', color: 'bg-purple-500 text-white' },
    { label: 'View Profile', icon: ExternalLink, path: `/${activeProfile.username}`, color: 'bg-emerald-500 text-white', external: true },
  ], [activeProfile.username]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white">
            Welcome back{activeProfile.displayName ? `, ${activeProfile.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here's what's happening with your profile
          </p>
        </div>
        <Link
          to="/dashboard/links"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink dark:bg-white text-white dark:text-ink rounded-full text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
        >
          <Plus size={16} />
          Add Block
        </Link>
      </div>

      {/* Stats Grid */}
      <SectionErrorBoundary name="stats">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-ink dark:text-white">
                {loading ? (
                  <span className="inline-block h-7 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : stat.isPercent ? (
                  `${stat.value.toFixed(1)}%`
                ) : (
                  stat.value.toLocaleString()
                )}
              </span>
              {!loading && stat.change !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    stat.change > 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {stat.change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(stat.change)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      </SectionErrorBoundary>

      {/* Quick Actions + Profile Status */}
      <SectionErrorBoundary name="quick actions">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-ink dark:text-white mb-4 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) =>
              action.external ? (
                <a
                  key={action.label}
                  href={action.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors text-center"
                >
                  <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center`}>
                    <action.icon size={18} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{action.label}</span>
                </a>
              ) : (
                <Link
                  key={action.label}
                  to={action.path}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors text-center"
                >
                  <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center`}>
                    <action.icon size={18} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{action.label}</span>
                </Link>
              )
            )}
          </div>
        </div>

        {/* Profile Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-ink dark:text-white mb-4 uppercase tracking-wider">Profile Status</h3>
          <div className="space-y-3">
            <StatusItem
              label="Published"
              active={!!activeProfile.isPublished}
            />
            <StatusItem
              label="Custom Domain"
              active={!!activeProfile.customDomain}
            />
            <StatusItem
              label="SEO Configured"
              active={!!(activeProfile.seoTitle && activeProfile.seoDescription)}
            />
            <StatusItem
              label="Branding Removed"
              active={!!activeProfile.removeBranding}
            />
          </div>
          <Link
            to="/dashboard/settings"
            className="mt-4 block text-center text-xs font-medium text-jam-red hover:text-red-700 transition-colors"
          >
            Manage Settings
          </Link>
        </div>
      </div>
      </SectionErrorBoundary>

      {/* Performance Hint */}
      {analytics && analytics.views === 0 && (
        <div className="bg-gradient-to-r from-jam-red/5 to-purple-500/5 dark:from-jam-red/10 dark:to-purple-500/10 border border-jam-red/10 dark:border-jam-red/20 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-ink dark:text-white mb-2">
            Share your profile to get started
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
            Copy your profile link and share it on social media, email signatures, or anywhere you want people to find you.
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/${activeProfile.username}`);
              toast.success('Profile link copied to clipboard!');
            }}
            className="px-5 py-2 bg-ink dark:bg-white text-white dark:text-ink rounded-full text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Copy Profile Link
          </button>
        </div>
      )}
    </div>
  );
};

const StatusItem: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    <span
      className={`w-2 h-2 rounded-full ${
        active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    />
  </div>
);

export default Dashboard;
