import React, { useEffect } from 'react';
import { WifiOff, Cloud, CloudOff, Check } from 'lucide-react';
import { useBuilderStore } from './hooks/useBuilderStore';
import { useOfflineDetection } from './hooks/useOfflineDetection';
import InputStage from './components/InputStage';
import LoadingState from './components/LoadingState';
import EditorSidebar from './components/EditorSidebar';
import Preview from './components/Preview';
import PublishBar from './components/PublishBar';
import { toast } from '../../stores/toastStore';
import type { BlockType, SiteData, ButtonStyleConfig } from '@tap/shared';

const API_BASE = '/api';

const DEFAULT_BUTTON_STYLE: ButtonStyleConfig = { shape: 'pill', fill: 'solid', shadow: 'none', color: '' };

interface GeneratedPage {
  name: string;
  bio: string;
  links: Array<{ label: string; url: string; type: string }>;
  themeId: string;
}

async function generateBioPageViaAPI(prompt: string): Promise<GeneratedPage> {
  const res = await fetch(`${API_BASE}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'AI generation failed');
  }
  return res.json();
}

async function optimizeCopyViaAPI(text: string, context: string) {
  const res = await fetch(`${API_BASE}/ai/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context }),
  });
  if (!res.ok) throw new Error('Copy optimization failed');
  const data = await res.json();
  return data.text;
}

const Builder: React.FC = () => {
  useOfflineDetection();

  const {
    stage, setStage, isOffline, isLoadingProfile,
    siteData, setSiteData, replaceSiteData, setIsAIProcessing, updateLink,
    loadProfile, createProfileFromSiteData, profileId,
    isSyncing, lastSyncedAt, syncError,
  } = useBuilderStore();

  // Load profile from API on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSyncing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSyncing]);

  // Ctrl+S / Cmd+S — save feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isSyncing) {
          toast.info('Saving in progress...');
        } else if (lastSyncedAt) {
          toast.success('All changes saved');
        } else {
          setSiteData({});
          toast.info('Saving...');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSyncing, lastSyncedAt, setSiteData]);

  const handleGenerate = async (name: string, desc: string) => {
    setStage('loading');
    setIsAIProcessing(true);

    let newData: SiteData;

    try {
      const generated = await generateBioPageViaAPI(`${name}: ${desc}`);

      newData = {
        name: generated.name,
        bio: generated.bio,
        avatarImage: null,
        favicon: null,
        links: (generated.links || []).map((l, i) => ({
          id: i.toString(),
          type: l.type as BlockType,
          label: l.label,
          url: l.url,
          style: { fontSize: 'md' as const, customColor: '', outline: false },
          active: true,
        })),
        socials: [],
        themeId: generated.themeId,
        fontId: 'serif',
        showFluidBackground: true,
        avatarInitials: generated.name.substring(0, 2).toUpperCase(),
        seo: {
          title: `${generated.name} | Tap`,
          description: generated.bio,
        },
        buttonStyle: DEFAULT_BUTTON_STYLE,
        layout: 'stack',
        customBgType: null,
        customBgColor: '',
        customBgUrl: null,
        ogImageUrl: null,
        removeBranding: false,
      };
    } catch (error) {
      console.error('AI Generation failed, using fallback', error);
      toast.warning('AI generation unavailable — we\u2019ve created a starter template for you.');
      newData = {
        name,
        bio: desc,
        avatarImage: null,
        favicon: null,
        links: [
          { id: '1', type: 'button', label: 'Schedule a Meeting', url: '#', style: { fontSize: 'md', customColor: '', outline: false }, active: true },
          { id: '2', type: 'button', label: 'View Portfolio', url: '#', style: { fontSize: 'md', customColor: '', outline: false }, active: true },
        ],
        socials: [],
        themeId: 'cream',
        fontId: 'serif',
        showFluidBackground: true,
        avatarInitials: name.substring(0, 2).toUpperCase(),
        seo: {
          title: `${name} | Tap`,
          description: desc,
        },
        buttonStyle: DEFAULT_BUTTON_STYLE,
        layout: 'stack',
        customBgType: null,
        customBgColor: '',
        customBgUrl: null,
        ogImageUrl: null,
        removeBranding: false,
      };
    }

    replaceSiteData(newData);
    setIsAIProcessing(false);
    setStage('editor');

    // Create profile in the database
    createProfileFromSiteData(newData);
  };

  const handleOptimizeCopy = async (id: string, currentText: string) => {
    try {
      const optimized = await optimizeCopyViaAPI(currentText, siteData.bio);
      updateLink(id, 'label', optimized);
    } catch (e) {
      console.error('Optimization failed', e);
      toast.error('Copy optimization failed. Try again later.');
    }
  };

  // Show loading spinner while fetching profile
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-jam-red rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading your page...</span>
        </div>
      </div>
    );
  }

  if (stage === 'input') return <InputStage onComplete={handleGenerate} />;
  if (stage === 'loading') return <LoadingState />;

  return (
    <div className="h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] mt-16 sm:mt-20 flex flex-col lg:flex-row bg-slate-50 overflow-hidden relative">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center py-3 text-sm font-bold shadow-2xl flex items-center justify-center gap-3 animate-fade-up">
          <div className="p-1.5 bg-white/20 rounded-full">
            <WifiOff size={18} />
          </div>
          <div className="flex flex-col items-start">
            <span className="leading-none">You are currently offline</span>
            <span className="text-[10px] opacity-80 font-normal">Changes are being saved locally to your device</span>
          </div>
        </div>
      )}

      {/* Sync Status Indicator */}
      {profileId && !isOffline && (
        <div className={`fixed bottom-4 right-4 sm:bottom-auto sm:top-24 z-50 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full backdrop-blur border shadow-sm transition-colors ${
          syncError ? 'bg-red-50/90 border-red-200 dark:bg-red-900/30 dark:border-red-800' : 'bg-white/80 border-slate-200 dark:bg-slate-900/80 dark:border-slate-700'
        }`}>
          {isSyncing ? (
            <>
              <Cloud size={12} className="text-blue-500 animate-pulse" />
              <span className="text-slate-500 dark:text-slate-400">Saving...</span>
            </>
          ) : syncError ? (
            <>
              <CloudOff size={12} className="text-red-500" />
              <span className="text-red-600 dark:text-red-400">Save failed</span>
              <button
                onClick={() => { setSiteData({}); }}
                className="ml-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline font-medium"
              >
                Retry
              </button>
            </>
          ) : lastSyncedAt ? (
            <>
              <Check size={12} className="text-green-500" />
              <span className="text-slate-400 dark:text-slate-500">Saved</span>
            </>
          ) : null}
        </div>
      )}

      <EditorSidebar onOptimizeCopy={handleOptimizeCopy} />

      <div className="flex-1 flex flex-col">
        <PublishBar />
        <Preview />
      </div>
    </div>
  );
};

export default Builder;
