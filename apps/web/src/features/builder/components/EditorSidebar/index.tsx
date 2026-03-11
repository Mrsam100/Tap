import React, { useState, useRef, useCallback } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useBuilderStore } from '../../hooks/useBuilderStore';
import { toast } from '../../../../stores/toastStore';
import ContentTab from './ContentTab';
import DesignTab from './DesignTab';
import SettingsTab from './SettingsTab';

interface EditorSidebarProps {
  onOptimizeCopy: (id: string, text: string) => void;
}

const TABS = ['content', 'design', 'settings'] as const;

const EditorSidebar: React.FC<EditorSidebarProps> = ({ onOptimizeCopy }) => {
  const { activeTab, setActiveTab, isPublished, publishToggle, clonePage, profileId } = useBuilderStore();
  const [publishing, setPublishing] = useState(false);
  const scrollPositions = useRef<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTabSwitch = useCallback((tab: typeof TABS[number]) => {
    // Save current scroll position
    if (scrollContainerRef.current) {
      scrollPositions.current[activeTab] = scrollContainerRef.current.scrollTop;
    }
    setActiveTab(tab);
    // Restore scroll position after render
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollPositions.current[tab] || 0;
      }
    });
  }, [activeTab, setActiveTab]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publishToggle();
      toast.success('Page published!');
    } catch {
      toast.error('Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const publishDisabledReason = !profileId
    ? 'Save your page first before publishing'
    : isPublished
      ? 'Your page is already live'
      : undefined;

  return (
    <div className="w-full lg:w-[480px] bg-white border-r border-slate-200 flex flex-col shadow-xl z-20 max-h-[50vh] lg:max-h-none">
      {/* Toolbar */}
      <div className="flex items-center border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 gap-4 sm:gap-6 bg-white z-10">
        <div role="tablist" aria-label="Editor sections" className="flex gap-6">
          {TABS.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`panel-${tab}`}
              id={`tab-${tab}`}
              onClick={() => handleTabSwitch(tab)}
              className={`pb-1 text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'text-ink border-b-2 border-jam-red' : 'text-slate-400 hover:text-ink'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              clonePage();
              toast.success('Page cloned! You can now edit this copy.');
            }}
            className="p-2 text-slate-400 hover:text-ink transition-colors"
            title="Clone Page"
            aria-label="Clone page"
          >
            <Copy size={18} />
          </button>
          <div title={publishDisabledReason}>
            <Button size="sm" onClick={handlePublish} disabled={isPublished || publishing || !profileId}>
              {publishing ? (
                <><Loader2 size={14} className="animate-spin" /> Publishing...</>
              ) : isPublished ? 'Published!' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div
        ref={scrollContainerRef}
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-8 no-scrollbar pb-24"
      >
        {activeTab === 'content' && <ContentTab onOptimizeCopy={onOptimizeCopy} />}
        {activeTab === 'design' && <DesignTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};

export default EditorSidebar;
