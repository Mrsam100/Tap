import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useBuilderStore } from '../hooks/useBuilderStore';
import { SOCIAL_PLATFORMS } from '../constants';
import type { SocialPlatform } from '@tap/shared';

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true; // empty is ok — not filled yet
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

const SocialEditor: React.FC = () => {
  const { siteData, addSocial, removeSocial, updateSocial } = useBuilderStore();
  const [invalidIds, setInvalidIds] = useState<Set<string>>(new Set());

  const handleUrlChange = (id: string, url: string) => {
    updateSocial(id, url);
    if (url && !isValidUrl(url)) {
      setInvalidIds(prev => new Set(prev).add(id));
    } else {
      setInvalidIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const alreadyAdded = new Set<string>(siteData.socials.map(s => s.platform));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Social Icons</h3>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {SOCIAL_PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => addSocial(p.id as SocialPlatform)}
            disabled={alreadyAdded.has(p.id)}
            className={`p-2 border rounded-lg transition-colors ${
              alreadyAdded.has(p.id)
                ? 'border-slate-100 text-slate-300 cursor-not-allowed dark:border-slate-700 dark:text-slate-600'
                : 'border-slate-200 text-slate-500 hover:border-jam-red hover:text-jam-red dark:border-slate-700 dark:text-slate-400'
            }`}
            title={alreadyAdded.has(p.id) ? `${p.label} already added` : p.label}
            aria-label={`Add ${p.label}`}
          >
            <p.icon size={16} />
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {siteData.socials.map((social) => {
          const platform = SOCIAL_PLATFORMS.find(p => p.id === social.platform);
          const isInvalid = invalidIds.has(social.id);
          return (
            <div key={social.id} className="animate-fade-up">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                  {platform?.icon && <platform.icon size={14} />}
                </div>
                <input
                  value={social.url}
                  onChange={(e) => handleUrlChange(social.id, e.target.value)}
                  placeholder={`https://${platform?.label?.toLowerCase() || 'example'}.com/yourname`}
                  className={`flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-md focus:outline-none transition-colors dark:text-white dark:placeholder-slate-500 ${
                    isInvalid ? 'border-red-300 dark:border-red-500 focus:border-red-400' : 'border-slate-200 dark:border-slate-700 focus:border-ink dark:focus:border-slate-400'
                  }`}
                />
                <button onClick={() => removeSocial(social.id)} className="text-slate-400 hover:text-red-500" aria-label={`Remove ${platform?.label || 'social'}`}>
                  <X size={14} />
                </button>
              </div>
              {isInvalid && (
                <p className="text-[10px] text-red-500 mt-0.5 ml-10 flex items-center gap-1"><AlertCircle size={10} /> Enter a valid URL</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialEditor;
