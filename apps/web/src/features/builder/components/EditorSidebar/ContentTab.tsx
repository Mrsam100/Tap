import React from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { useBuilderStore } from '../../hooks/useBuilderStore';
import { MEMOJIS } from '../../constants';
import SocialEditor from '../SocialEditor';
import BlockTypeSelector from '../BlockEditor/BlockTypeSelector';
import BlockEditorItem from '../BlockEditor';

interface ContentTabProps {
  onOptimizeCopy: (id: string, text: string) => void;
}

const ContentTab: React.FC<ContentTabProps> = ({ onOptimizeCopy }) => {
  const { siteData, setSiteData, handleImageUpload } = useBuilderStore();

  return (
    <>
      {/* Profile Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile</h3>
        <div className="flex items-start gap-4">
          <div className="relative group w-20 h-20 shrink-0">
            <div className="w-full h-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-300">
              {siteData.avatarImage ? (
                <img src={siteData.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={24} />
              )}
            </div>
            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Upload size={16} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'avatarImage');
                }}
              />
            </label>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-ink dark:text-white">Display Name</label>
                <span className={`text-[10px] ${siteData.name.length > 80 ? 'text-red-500' : 'text-slate-400'}`}>{siteData.name.length}/100</span>
              </div>
              <input
                value={siteData.name}
                onChange={(e) => { if (e.target.value.length <= 100) setSiteData({ name: e.target.value }); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-ink dark:focus:border-slate-400 transition-colors text-ink dark:text-white"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-ink dark:text-white">Bio</label>
                <span className={`text-[10px] ${siteData.bio.length > 240 ? 'text-red-500' : 'text-slate-400'}`}>{siteData.bio.length}/300</span>
              </div>
              <textarea
                value={siteData.bio}
                onChange={(e) => { if (e.target.value.length <= 300) setSiteData({ bio: e.target.value }); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-ink dark:focus:border-slate-400 transition-colors h-20 resize-none text-ink dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Memoji Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-ink">Or choose a Memoji</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {MEMOJIS.map(m => (
              <button
                key={m.id}
                onClick={() => setSiteData({ avatarImage: m.url })}
                className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full border-2 shrink-0 transition-all snap-start ${siteData.avatarImage === m.url ? 'border-jam-red scale-110' : 'border-transparent hover:border-slate-200'}`}
              >
                <img src={m.url} alt="Memoji" loading="lazy" className="w-full h-full rounded-full" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Social Icons */}
      <SocialEditor />

      {/* Content Blocks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Content Blocks</h3>
        </div>
        <BlockTypeSelector />
        <div className="space-y-3">
          {siteData.links.map((link, index) => (
            <BlockEditorItem
              key={link.id}
              link={link}
              index={index}
              onOptimizeCopy={onOptimizeCopy}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default ContentTab;
