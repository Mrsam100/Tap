import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Link2,
  Palette,
  BarChart3,
  DollarSign,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crown,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../src/stores/authStore';
import ConfirmDialog from './ConfirmDialog';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Links', path: '/dashboard/links', icon: Link2 },
  { label: 'Appearance', path: '/dashboard/appearance', icon: Palette },
  { label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Monetization', path: '/dashboard/monetization', icon: DollarSign },
  { label: 'Audience', path: '/dashboard/audience', icon: Users },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
];

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  pro: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  business: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
  profileUsername?: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  collapsed,
  onToggle,
  onMobileClose,
  profileUsername,
}) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setConfirmLogout(false);
    await logout();
  };

  return (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Logo + Collapse */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 dark:border-slate-800">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-7 h-7">
              <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-jam-red transition-transform duration-500 group-hover:rotate-6">
                <rect x="11" y="8" width="10" height="22" rx="5" stroke="currentColor" strokeWidth="2.5" className="fill-cream dark:fill-slate-900" />
                <rect x="2" y="2" width="28" height="10" rx="5" stroke="currentColor" strokeWidth="2.5" className="fill-cream dark:fill-slate-900" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-ink dark:text-white font-serif">Tap.</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <div key={item.path} className="relative group/nav">
              <Link
                to={item.path}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-jam-red/10 text-jam-red dark:bg-jam-red/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-white'
                }`}
              >
                <item.icon
                  size={20}
                  className={`flex-shrink-0 ${active ? 'text-jam-red' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-ink dark:bg-white text-white dark:text-ink text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}

        {/* View Public Profile */}
        {profileUsername && (
          <a
            href={`/${profileUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-white transition-all duration-200"
            title={collapsed ? 'View Profile' : undefined}
          >
            <ExternalLink size={20} className="flex-shrink-0 text-slate-400 dark:text-slate-500" />
            {!collapsed && <span>View Profile</span>}
          </a>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3">
        {user && (
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-jam-red text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user.displayName?.[0]?.toUpperCase() || user.username[0]?.toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink dark:text-white truncate" title={user.displayName || user.username}>
                  {user.displayName || user.username}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${PLAN_COLORS[user.plan] || PLAN_COLORS.free}`}>
                    {user.plan === 'free' ? 'Free' : user.plan}
                  </span>
                  {user.plan !== 'free' && <Crown size={10} className="text-amber-500" />}
                </div>
              </div>
            )}
            <button
              onClick={() => setConfirmLogout(true)}
              disabled={loggingOut}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        variant="warning"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </aside>
  );
};

export default DashboardSidebar;
