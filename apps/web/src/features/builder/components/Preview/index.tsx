import React from 'react';
import { motion } from 'motion/react';
import { Smartphone, Monitor, Share2 } from 'lucide-react';
import { useBuilderStore } from '../../hooks/useBuilderStore';
import { THEMES, FONTS } from '../../constants';
import ProfileHeader from './ProfileHeader';
import BlockRenderer from './BlockRenderer';

const Preview: React.FC = () => {
  const { siteData, previewDevice, setPreviewDevice, isPublished, profileUsername } = useBuilderStore();
  const currentTheme = THEMES[siteData.themeId] || THEMES['cream'];

  // Custom background style
  const customBgStyle: React.CSSProperties = {};
  if (siteData.customBgType === 'color') {
    customBgStyle.backgroundColor = siteData.customBgColor;
  } else if (siteData.customBgType === 'gradient' && siteData.customBgUrl) {
    customBgStyle.background = siteData.customBgUrl;
  } else if (siteData.customBgType === 'image' && siteData.customBgUrl) {
    const safeUrl = siteData.customBgUrl.replace(/["'()\\]/g, '\\$&');
    customBgStyle.backgroundImage = `url("${safeUrl}")`;
    customBgStyle.backgroundSize = 'cover';
    customBgStyle.backgroundPosition = 'center';
  }

  const hasCustomBg = siteData.customBgType != null;

  // Layout class for link container
  const isGridLayout = siteData.layout === 'grid';

  return (
    <div className="flex-1 bg-slate-100/50 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300">
      {/* Device Toggle */}
      <div className="absolute top-6 z-30 bg-white border border-slate-200 rounded-full p-1 flex items-center shadow-sm">
        <button
          onClick={() => setPreviewDevice('mobile')}
          className={`p-2 rounded-full transition-all ${previewDevice === 'mobile' ? 'bg-slate-100 text-ink' : 'text-slate-400 hover:text-ink'}`}
          title="Mobile View"
        >
          <Smartphone size={18} />
        </button>
        <button
          onClick={() => setPreviewDevice('desktop')}
          className={`p-2 rounded-full transition-all ${previewDevice === 'desktop' ? 'bg-slate-100 text-ink' : 'text-slate-400 hover:text-ink'}`}
          title="Desktop View"
        >
          <Monitor size={18} />
        </button>
      </div>

      {/* Background Dots */}
      <div className="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none" />

      {/* Published Banner */}
      {isPublished && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-ink text-white px-6 py-2 rounded-full shadow-xl flex items-center gap-3 animate-fade-up z-30">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Your site is live!
          <button className="text-slate-400 hover:text-white"><Share2 size={16} /></button>
        </div>
      )}

      {/* Device Frame */}
      <div
        className={`
          bg-white shadow-2xl relative overflow-hidden z-10 transition-all duration-500 ease-in-out flex flex-col
          ${previewDevice === 'mobile' ? 'w-[340px] h-[680px] rounded-[40px] border-[8px] border-slate-900' : 'w-[90%] max-w-5xl h-[85%] rounded-xl border border-slate-200 mt-12'}
        `}
      >
        {/* Desktop Browser Bar */}
        {previewDevice === 'desktop' && (
          <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
            </div>
            <div className="flex-1 text-center text-xs text-slate-400 font-mono bg-white mx-4 py-1 rounded border border-slate-200 flex items-center justify-center gap-2">
              {siteData.favicon && <img src={siteData.favicon} className="w-3 h-3" alt="" />}
              tap.bio/{profileUsername || siteData.name.toLowerCase().replace(/\s/g, '')}
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        <div
          className={`w-full h-full flex flex-col overflow-y-auto no-scrollbar transition-colors duration-300 relative ${!hasCustomBg ? `${currentTheme.colors.bg} ${currentTheme.colors.text}` : ''}`}
          style={hasCustomBg ? { ...customBgStyle, color: 'inherit' } : undefined}
        >
          {/* Fluid Background */}
          {siteData.showFluidBackground && (
            <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
          )}

          {/* Custom bg overlay for readability */}
          {hasCustomBg && (
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          )}

          <div className={`
            w-full mx-auto relative z-10
            ${previewDevice === 'desktop' ? 'max-w-3xl py-16' : 'py-12'}
            ${FONTS.find(f => f.id === siteData.fontId)?.class || 'font-serif'}
          `}>
            <ProfileHeader siteData={siteData} theme={currentTheme} />

            {/* Links */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className={`px-4 sm:px-6 flex-1 max-w-md mx-auto w-full ${
                isGridLayout ? 'grid grid-cols-2 gap-3' : 'space-y-4'
              }`}
            >
              {siteData.links.map((link) => (
                <BlockRenderer
                  key={link.id}
                  link={link}
                  theme={currentTheme}
                  themeId={siteData.themeId}
                  buttonStyle={siteData.buttonStyle}
                />
              ))}
              {siteData.links.length === 0 && (
                <div className={`text-center py-8 opacity-40 text-xs italic border border-dashed rounded-xl ${isGridLayout ? 'col-span-2' : ''}`}>
                  Add blocks to see them here
                </div>
              )}
            </motion.div>

            {/* Branding Footer */}
            {!siteData.removeBranding && (
              <div className="pb-8 pt-12 text-center">
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-30">
                  Built with Tap
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
