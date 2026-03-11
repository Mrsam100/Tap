import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { ContentBlock, ThemeConfig, ButtonStyleConfig } from '@tap/shared';

// ── Live Countdown Hook ──────────────────────────────────────────
function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hrs: 0, min: 0, sec: 0, expired: true });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    if (isNaN(target)) return;

    const calc = () => {
      const diff = target - Date.now();
      if (diff <= 0) return { days: 0, hrs: 0, min: 0, sec: 0, expired: true };
      return {
        days: Math.floor(diff / 86400000),
        hrs: Math.floor((diff % 86400000) / 3600000),
        min: Math.floor((diff % 3600000) / 60000),
        sec: Math.floor((diff % 60000) / 1000),
        expired: false,
      };
    };

    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

interface BlockRendererProps {
  link: ContentBlock;
  theme: ThemeConfig;
  themeId: string;
  buttonStyle: ButtonStyleConfig;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const ALLOWED_EMBED_HOSTS = [
  'www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com',
  'player.vimeo.com', 'open.spotify.com', 'w.soundcloud.com',
  'embed.music.apple.com', 'bandcamp.com',
];

function isSafeEmbedUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_EMBED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

const SHAPE_CLASSES: Record<string, string> = {
  rounded: 'rounded-xl',
  pill: 'rounded-full',
  square: 'rounded-none',
  soft: 'rounded-lg',
};

function getButtonClasses(bs: ButtonStyleConfig, theme: ThemeConfig, isDark: boolean): string {
  const shape = SHAPE_CLASSES[bs.shape] || 'rounded-xl';

  let fillClasses = '';
  switch (bs.fill) {
    case 'outline':
      fillClasses = 'bg-transparent border-2';
      break;
    case 'glass':
      fillClasses = 'bg-white/10 backdrop-blur-sm border border-white/20';
      break;
    case 'shadow':
      fillClasses = `${theme.colors.cardBg} shadow-lg border-0`;
      break;
    default: // solid
      fillClasses = `${theme.colors.cardBg} ${isDark ? 'border-transparent' : 'border border-slate-200'}`;
  }

  return `${shape} ${fillClasses}`;
}

// ── Newsletter Block with local email capture state ──────────────
const NewsletterBlock: React.FC<{ link: ContentBlock; theme: ThemeConfig; buttonStyle: ButtonStyleConfig }> = ({ link, theme, buttonStyle }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      return;
    }
    // In preview mode, just show success feedback
    setStatus('success');
    setEmail('');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <motion.div variants={itemVariants} key={link.id} className={`p-6 border shadow-tap-s ${SHAPE_CLASSES[buttonStyle.shape] || 'rounded-xl'} ${theme.colors.cardBg} ${theme.colors.cardBorder}`}>
      <h4 className="font-bold text-center mb-4">{link.label}</h4>
      {status === 'success' ? (
        <p className="text-center text-sm text-green-600 font-medium py-2">Thanks for subscribing!</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
            placeholder="Email address"
            className={`flex-1 px-3 py-2 rounded-lg bg-slate-50 border text-sm focus:outline-none ${status === 'error' ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
          />
          <Button size="sm" type="submit">Join</Button>
        </form>
      )}
      {status === 'error' && <p className="text-xs text-red-500 mt-1">Please enter a valid email</p>}
    </motion.div>
  );
};

const BlockRenderer: React.FC<BlockRendererProps> = ({ link, theme, themeId, buttonStyle }) => {
  const isDarkTheme = ['dark', 'forest', 'navy', 'sunset', 'charcoal', 'neon', 'wine'].includes(themeId);
  const countdown = useCountdown(link.type === 'timer' ? link.countdownDate : undefined);

  if (link.type === 'section') {
    return (
      <motion.div variants={itemVariants} key={link.id} className="pt-6 pb-2">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 text-center">{link.label}</h3>
      </motion.div>
    );
  }

  if (link.type === 'video') {
    return (
      <motion.div variants={itemVariants} key={link.id} className="rounded-xl overflow-hidden shadow-tap-s aspect-video bg-black">
        {isSafeEmbedUrl(link.embedUrl) ? (
          <iframe
            src={link.embedUrl}
            className="w-full h-full"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="no-referrer"
            title={link.label}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
            Invalid or unsupported video URL
          </div>
        )}
      </motion.div>
    );
  }

  if (link.type === 'product') {
    return (
      <motion.div
        variants={itemVariants}
        key={link.id}
        whileHover={{ scale: 1.02 }}
        className={`flex items-center gap-4 p-3 border shadow-tap-s ${SHAPE_CLASSES[buttonStyle.shape] || 'rounded-xl'} ${theme.colors.cardBg} ${theme.colors.cardBorder}`}
      >
        <img src={link.image} alt={link.label} className="w-16 h-16 rounded-lg object-cover" />
        <div className="flex-1">
          <h4 className="font-bold text-sm">{link.label}</h4>
          <p className="text-xs opacity-60">{link.price}</p>
        </div>
        <Button size="sm">Buy</Button>
      </motion.div>
    );
  }

  if (link.type === 'newsletter') {
    return <NewsletterBlock link={link} theme={theme} buttonStyle={buttonStyle} />;
  }

  if (link.type === 'timer') {
    const segments = countdown.days > 0
      ? [{ value: countdown.days, label: 'Days' }, { value: countdown.hrs, label: 'Hrs' }, { value: countdown.min, label: 'Min' }, { value: countdown.sec, label: 'Sec' }]
      : [{ value: countdown.hrs, label: 'Hrs' }, { value: countdown.min, label: 'Min' }, { value: countdown.sec, label: 'Sec' }];

    return (
      <motion.div variants={itemVariants} key={link.id} className={`p-6 border shadow-tap-s text-center ${SHAPE_CLASSES[buttonStyle.shape] || 'rounded-xl'} ${theme.colors.cardBg} ${theme.colors.cardBorder}`}>
        <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">{link.label}</h4>
        {countdown.expired && !link.countdownDate ? (
          <p className="text-sm opacity-50">Set a target date to start the countdown</p>
        ) : countdown.expired ? (
          <p className="text-sm font-bold opacity-70">Time's up!</p>
        ) : (
          <div className="flex justify-center gap-4">
            {segments.map((seg, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-2xl font-bold tabular-nums">{String(seg.value).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase opacity-50">{seg.label}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  if (link.type === 'whatsapp') {
    const waUrl = link.url && link.url !== '#'
      ? link.url
      : 'https://wa.me/';
    return (
      <motion.a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        variants={itemVariants}
        key={link.id}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-4 px-6 font-medium flex items-center justify-center gap-2 shadow-tap-s transition-all duration-300 cursor-pointer bg-green-500 text-white border-none no-underline ${SHAPE_CLASSES[buttonStyle.shape] || 'rounded-xl'}`}
      >
        <MessageSquare size={18} />
        {link.label || 'Chat on WhatsApp'}
      </motion.a>
    );
  }

  // Default: button/link — apply buttonStyle system
  const btnClasses = getButtonClasses(buttonStyle, theme, isDarkTheme);

  return (
    <motion.div
      variants={itemVariants}
      key={link.id}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full py-4 px-6 font-medium flex items-center justify-between shadow-tap-s transition-all duration-300 cursor-pointer
        ${btnClasses}
        ${theme.colors.cardText}
      `}
      style={{
        fontSize: link.style.fontSize === 'sm' ? '0.875rem' : link.style.fontSize === 'lg' ? '1.125rem' : '1rem',
        color: link.style.customColor || (buttonStyle.color || undefined),
        borderColor: link.style.outline ? (link.style.customColor || buttonStyle.color || undefined) : (buttonStyle.fill === 'outline' ? (buttonStyle.color || undefined) : undefined),
        backgroundColor: buttonStyle.fill === 'solid' && buttonStyle.color ? buttonStyle.color : undefined,
      }}
    >
      {link.label}
      <ArrowRight size={14} className={`opacity-50 ${theme.colors.accent}`} style={{ color: link.style.customColor || (buttonStyle.color || undefined) }} />
    </motion.div>
  );
};

export default BlockRenderer;
