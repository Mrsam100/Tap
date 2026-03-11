import React, { useState } from 'react';
import { Check, Sparkles, Grid3X3, Rows3, LayoutGrid, Star, Columns3, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import { useBuilderStore } from '../../hooks/useBuilderStore';
import { THEMES, FONTS } from '../../constants';
import { uploadFile } from '../../../../lib/profileApi';
import type { ButtonStyleConfig } from '@tap/shared';

const BUTTON_SHAPES = [
  { id: 'rounded', label: 'Rounded', class: 'rounded-xl' },
  { id: 'pill', label: 'Pill', class: 'rounded-full' },
  { id: 'square', label: 'Square', class: 'rounded-none' },
  { id: 'soft', label: 'Soft', class: 'rounded-lg' },
];

const BUTTON_FILLS = [
  { id: 'solid', label: 'Solid' },
  { id: 'outline', label: 'Outline' },
  { id: 'glass', label: 'Glass' },
  { id: 'shadow', label: 'Shadow' },
];

const LAYOUTS = [
  { id: 'stack', label: 'Stack', icon: Rows3, desc: 'Single column list' },
  { id: 'grid', label: 'Grid', icon: Grid3X3, desc: '2-column grid' },
  { id: 'carousel', label: 'Carousel', icon: Columns3, desc: 'Swipeable cards' },
  { id: 'showcase', label: 'Showcase', icon: LayoutGrid, desc: 'Featured + grid' },
  { id: 'featured', label: 'Featured', icon: Star, desc: 'Hero card + list' },
];

const BG_TYPES = [
  { id: null, label: 'None' },
  { id: 'color', label: 'Color' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'image', label: 'Image' },
];

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fccb90, #d57eeb)',
  'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
];

const DesignTab: React.FC = () => {
  const { siteData, setSiteData } = useBuilderStore();
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [showAllFonts, setShowAllFonts] = useState(false);

  const themeEntries = Object.values(THEMES);
  const visibleThemes = showAllThemes ? themeEntries : themeEntries.slice(0, 8);

  const visibleFonts = showAllFonts ? FONTS : FONTS.slice(0, 6);

  const buttonStyle = siteData.buttonStyle;
  const customBgType = siteData.customBgType;
  const customBgColor = siteData.customBgColor;
  const layout = siteData.layout;

  const updateButtonStyle = (key: keyof ButtonStyleConfig, value: string) => {
    const newStyle = { ...buttonStyle, [key]: value };
    setSiteData({ buttonStyle: newStyle });
  };

  return (
    <div className="space-y-8">
      {/* Templates */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Choose a Template</h3>
        <div className="grid grid-cols-2 gap-3">
          {visibleThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSiteData({ themeId: theme.id })}
              aria-label={`${theme.name} theme`}
              aria-pressed={siteData.themeId === theme.id}
              className={`
                relative p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02]
                ${siteData.themeId === theme.id ? 'border-jam-red ring-1 ring-jam-red/20' : 'border-slate-200 hover:border-slate-300'}
              `}
            >
              <div className={`w-full h-16 mb-2 rounded-lg shadow-sm border ${theme.colors.cardBorder} ${theme.colors.bg} relative overflow-hidden`}>
                <div className={`absolute top-2 left-2 w-6 h-6 rounded-full ${theme.colors.avatarBg}`}></div>
                <div className={`absolute top-10 left-2 w-12 h-1.5 rounded ${theme.colors.cardBg}`}></div>
                <div className={`absolute top-10 left-16 w-6 h-1.5 rounded ${theme.colors.cardBg}`}></div>
              </div>
              <div className="font-medium text-xs text-ink">{theme.name}</div>
              {siteData.themeId === theme.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-jam-red rounded-full flex items-center justify-center text-white">
                  <Check size={8} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
        {themeEntries.length > 8 && (
          <button
            onClick={() => setShowAllThemes(!showAllThemes)}
            className="w-full text-xs text-slate-500 hover:text-ink flex items-center justify-center gap-1 py-1"
          >
            {showAllThemes ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all {themeEntries.length} themes</>}
          </button>
        )}
      </div>

      {/* Typography */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Typography</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visibleFonts.map(font => (
            <button
              key={font.id}
              onClick={() => setSiteData({ fontId: font.id })}
              aria-label={`${font.name} font`}
              aria-pressed={siteData.fontId === font.id}
              className={`
                p-2.5 sm:p-2 rounded-lg border-2 text-center transition-all min-h-[44px]
                ${siteData.fontId === font.id ? 'border-jam-red bg-jam-red/5' : 'border-slate-200 hover:border-slate-300'}
              `}
            >
              <div className={`text-base mb-0.5 ${font.class}`}>Aa</div>
              <div className="text-[9px] font-bold uppercase tracking-tight text-slate-500 truncate">{font.name}</div>
            </button>
          ))}
        </div>
        {FONTS.length > 6 && (
          <button
            onClick={() => setShowAllFonts(!showAllFonts)}
            className="w-full text-xs text-slate-500 hover:text-ink flex items-center justify-center gap-1 py-1"
          >
            {showAllFonts ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all {FONTS.length} fonts</>}
          </button>
        )}
      </div>

      {/* Layout */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Layout</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LAYOUTS.map(l => {
            const Icon = l.icon;
            return (
              <button
                key={l.id}
                onClick={() => setSiteData({ layout: l.id })}
                aria-label={`${l.label} layout — ${l.desc}`}
                aria-pressed={layout === l.id}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all min-h-[48px]
                  ${layout === l.id ? 'border-jam-red bg-jam-red/5' : 'border-slate-200 hover:border-slate-300'}
                `}
              >
                <Icon size={18} className="mx-auto mb-1 text-slate-600" />
                <div className="text-[10px] font-bold uppercase tracking-tight text-slate-500">{l.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Button Style */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Palette size={14} /> Button Style
        </h3>

        <div>
          <label className="block text-[10px] font-medium text-slate-500 mb-2 uppercase">Shape</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BUTTON_SHAPES.map(s => (
              <button
                key={s.id}
                onClick={() => updateButtonStyle('shape', s.id)}
                className={`
                  p-2 border-2 transition-all text-[10px] font-bold uppercase
                  ${s.class}
                  ${buttonStyle.shape === s.id ? 'border-jam-red bg-jam-red/5' : 'border-slate-200 hover:border-slate-300'}
                `}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-slate-500 mb-2 uppercase">Fill</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BUTTON_FILLS.map(f => (
              <button
                key={f.id}
                onClick={() => updateButtonStyle('fill', f.id)}
                className={`
                  p-2 rounded-lg border-2 transition-all text-[10px] font-bold uppercase
                  ${buttonStyle.fill === f.id ? 'border-jam-red bg-jam-red/5' : 'border-slate-200 hover:border-slate-300'}
                `}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="btn-color-picker" className="block text-[10px] font-medium text-slate-500 mb-2 uppercase">Button Color</label>
          <div className="flex items-center gap-3">
            <input
              id="btn-color-picker"
              type="color"
              value={buttonStyle.color || '#000000'}
              onChange={(e) => updateButtonStyle('color', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-slate-200"
              aria-label="Button color picker"
            />
            <input
              type="text"
              value={buttonStyle.color || ''}
              onChange={(e) => updateButtonStyle('color', e.target.value)}
              placeholder="Auto (theme)"
              aria-label="Button color hex value"
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-ink"
            />
            {buttonStyle.color && (
              <button
                onClick={() => updateButtonStyle('color', '')}
                className="text-xs text-slate-400 hover:text-ink"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Background */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Background</h3>

        <div className="flex gap-2">
          {BG_TYPES.map(t => (
            <button
              key={t.id || 'none'}
              onClick={() => setSiteData({ customBgType: t.id })}
              className={`
                flex-1 py-2 rounded-lg border-2 text-[10px] font-bold uppercase transition-all
                ${customBgType === t.id ? 'border-jam-red bg-jam-red/5' : 'border-slate-200 hover:border-slate-300'}
              `}
            >
              {t.label}
            </button>
          ))}
        </div>

        {customBgType === 'color' && (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customBgColor}
              onChange={(e) => setSiteData({ customBgColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border border-slate-200"
            />
            <input
              type="text"
              value={customBgColor}
              onChange={(e) => setSiteData({ customBgColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
        )}

        {customBgType === 'gradient' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {PRESET_GRADIENTS.map((g, i) => (
              <button
                key={i}
                onClick={() => setSiteData({ customBgUrl: g })}
                className={`
                  w-full h-10 rounded-lg border-2 transition-all
                  ${siteData.customBgUrl === g ? 'border-jam-red' : 'border-slate-200'}
                `}
                style={{ background: g }}
              />
            ))}
          </div>
        )}

        {customBgType === 'image' && (
          <div>
            <label className="block px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg text-center cursor-pointer hover:border-slate-300 transition-colors">
              <span className="text-xs text-slate-500">Click to upload background image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const { url } = await uploadFile(file);
                      setSiteData({ customBgUrl: url });
                    } catch {
                      // Fallback to base64 if upload fails (e.g. offline)
                      const reader = new FileReader();
                      reader.onloadend = () => setSiteData({ customBgUrl: reader.result as string });
                      reader.readAsDataURL(file);
                    }
                  }
                }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Fluid Background */}
      <div className="pt-6 border-t border-slate-100">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-ink flex items-center gap-2">
              <Sparkles size={14} className="text-jam-red" />
              Fluid Background
            </div>
            <div className="text-xs text-slate-500">Add interactive background dots to your page</div>
          </div>
          <input
            type="checkbox"
            checked={siteData.showFluidBackground}
            onChange={(e) => setSiteData({ showFluidBackground: e.target.checked })}
            className="w-5 h-5 accent-jam-red"
          />
        </label>
      </div>
    </div>
  );
};

export default DesignTab;
