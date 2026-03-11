import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import { useAuthStore } from '../src/stores/authStore';
import { fetchProfiles } from '../src/lib/profileApi';
import type { ApiProfile } from '@tap/shared';

const SIDEBAR_COLLAPSED_KEY = 'tap_sidebar_collapsed';

const DashboardLayout: React.FC = () => {
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profiles, setProfiles] = useState<ApiProfile[]>([]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  // Load user profiles for sidebar
  useEffect(() => {
    if (!user) return;
    fetchProfiles()
      .then((data) => setProfiles(data.profiles))
      .catch(() => {});
  }, [user]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  const activeProfile = profiles[0];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          profileUsername={activeProfile?.username}
        />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <DashboardSidebar
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
          onMobileClose={() => setMobileOpen(false)}
          profileUsername={activeProfile?.username}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-14 px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Profile selector */}
            {activeProfile && (
              <div className="flex items-center gap-2">
                {activeProfile.avatarUrl ? (
                  <img
                    src={activeProfile.avatarUrl}
                    alt={activeProfile.displayName || activeProfile.username}
                    className="w-6 h-6 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {activeProfile.displayName?.[0]?.toUpperCase() || activeProfile.username[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-ink dark:text-white hidden sm:inline">
                  {activeProfile.displayName || `@${activeProfile.username}`}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeProfile && (
              <a
                href={`/${activeProfile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                tap.bio/{activeProfile.username}
              </a>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ profiles, activeProfile }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
