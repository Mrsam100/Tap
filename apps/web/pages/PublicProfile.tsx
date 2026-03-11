import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import type { PublicProfile as PublicProfileType, SiteData, BlockType, SocialPlatform } from '@tap/shared';
import ProfileHeader from '../src/features/builder/components/Preview/ProfileHeader';
import BlockRenderer from '../src/features/builder/components/Preview/BlockRenderer';
import { THEMES } from '../src/features/builder/constants/themes';
import { FONTS } from '../src/features/builder/constants/fonts';
import { fetchPublicProfile } from '../src/lib/profileApi';
import { trackPageView, trackEngagement, trackClick } from '../src/lib/tracker';

/** Convert API PublicProfile → SiteData for existing Preview components */
function toSiteData(profile: PublicProfileType): SiteData {
  return {
    name: profile.displayName || '',
    bio: profile.bio || '',
    avatarImage: profile.avatarUrl || null,
    favicon: profile.faviconUrl || null,
    themeId: profile.themeId || 'cream',
    fontId: profile.fontId || 'serif',
    showFluidBackground: profile.showFluidBg ?? false,
    avatarInitials: (profile.displayName || '').substring(0, 2).toUpperCase(),
    seo: {
      title: profile.seoTitle || '',
      description: profile.seoDescription || '',
    },
    links: (profile.links || []).map((l) => ({
      id: l.id,
      type: (l.type || 'button') as BlockType,
      label: l.label || '',
      url: l.url || '#',
      style: {
        fontSize: ((l.style as Record<string, unknown>)?.fontSize as 'sm' | 'md' | 'lg') || 'md',
        customColor: ((l.style as Record<string, unknown>)?.customColor as string) || '',
        outline: ((l.style as Record<string, unknown>)?.outline as boolean) || false,
      },
      active: l.isActive ?? true,
      price: (l.metadata as Record<string, unknown>)?.price as string | undefined,
      image: l.thumbnailUrl || (l.metadata as Record<string, unknown>)?.image as string | undefined,
      embedUrl: (l.metadata as Record<string, unknown>)?.embedUrl as string | undefined,
      countdownDate: (l.metadata as Record<string, unknown>)?.countdownDate as string | undefined,
      // Access control
      scheduledStart: l.scheduledStart || null,
      scheduledEnd: l.scheduledEnd || null,
      ageGate: l.ageGate ?? false,
      minAge: l.minAge || null,
      sensitive: l.sensitive ?? false,
      emailGate: l.emailGate ?? false,
    })),
    socials: (profile.socials || []).map((s) => ({
      id: s.id,
      platform: s.platform as SocialPlatform,
      url: s.url,
    })),
    buttonStyle: {
      shape: ((profile.buttonStyle as Record<string, unknown>)?.shape as 'rounded' | 'pill' | 'square' | 'soft') || 'rounded',
      fill: ((profile.buttonStyle as Record<string, unknown>)?.fill as 'solid' | 'outline' | 'glass' | 'shadow') || 'solid',
      shadow: ((profile.buttonStyle as Record<string, unknown>)?.shadow as string) || 'none',
      color: ((profile.buttonStyle as Record<string, unknown>)?.color as string) || '',
    },
    layout: profile.layout || 'stack',
    customBgType: profile.customBgType || null,
    customBgColor: profile.customBgColor || '#6366f1',
    customBgUrl: profile.customBgUrl || null,
    ogImageUrl: profile.ogImageUrl || null,
    removeBranding: profile.removeBranding ?? false,
  };
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const NAVIGABLE_TYPES = new Set(['button', 'product', 'whatsapp', 'music', 'event']);

// Gate types for modals
type GateModal =
  | { type: 'email'; linkId: string; label: string }
  | { type: 'age'; linkId: string; label: string; minAge: number }
  | { type: 'sensitive'; linkId: string; label: string; url: string; linkType: string };

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Gate state
  const [unlockedLinks, setUnlockedLinks] = useState<Set<string>>(new Set());
  const [gateModal, setGateModal] = useState<GateModal | null>(null);
  const [gateEmail, setGateEmail] = useState('');
  const [gateName, setGateName] = useState('');
  const [gateBirthYear, setGateBirthYear] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateLoading, setGateLoading] = useState(false);

  useEffect(() => {
    if (!username) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetchPublicProfile(username)
      .then(({ profile }) => {
        setProfile(profile);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [username]);

  // Analytics tracking
  useEffect(() => {
    if (!profile) return;
    trackPageView(profile.id);
    return trackEngagement(profile.id);
  }, [profile]);

  const handleLinkClick = useCallback(
    (linkId: string, url: string, type: string) => {
      if (!profile) return;

      // Find the original link data with gate info
      const linkData = profile.links?.find(l => l.id === linkId);
      if (!linkData) return;

      // Check gates (unless already unlocked)
      if (!unlockedLinks.has(linkId)) {
        // Sensitive content warning first
        if (linkData.sensitive) {
          setGateModal({ type: 'sensitive', linkId, label: linkData.label || '', url, linkType: type });
          return;
        }
        // Email gate
        if (linkData.emailGate) {
          setGateModal({ type: 'email', linkId, label: linkData.label || '' });
          return;
        }
        // Age gate
        if (linkData.ageGate) {
          setGateModal({ type: 'age', linkId, label: linkData.label || '', minAge: linkData.minAge || 18 });
          return;
        }
      }

      trackClick(linkId, profile.id);
      if (NAVIGABLE_TYPES.has(type) && url && url !== '#') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [profile, unlockedLinks]
  );

  // After a gate is unlocked, navigate to the link using already-loaded profile data
  const navigateAfterUnlock = useCallback((linkId: string) => {
    if (!profile) return;
    const linkData = profile.links?.find(l => l.id === linkId);
    if (!linkData) return;
    const url = linkData.url || '#';
    const type = linkData.type || 'button';
    trackClick(linkId, profile.id);
    if (NAVIGABLE_TYPES.has(type) && url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [profile]);

  const handleEmailGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateModal || gateModal.type !== 'email') return;
    setGateError('');
    setGateLoading(true);
    try {
      const res = await fetch(`/api/public/gate/email/${gateModal.linkId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gateEmail.trim(), name: gateName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify');
      const unlockId = gateModal.linkId;
      setUnlockedLinks(prev => new Set(prev).add(unlockId));
      setGateModal(null);
      setGateEmail('');
      setGateName('');
      navigateAfterUnlock(unlockId);
    } catch (err: any) {
      setGateError(err.message || 'Something went wrong');
    } finally {
      setGateLoading(false);
    }
  };

  const handleAgeGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateModal || gateModal.type !== 'age') return;
    setGateError('');
    setGateLoading(true);
    try {
      const res = await fetch(`/api/public/gate/age/${gateModal.linkId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthYear: parseInt(gateBirthYear) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Age verification failed');
      const unlockId = gateModal.linkId;
      setUnlockedLinks(prev => new Set(prev).add(unlockId));
      setGateModal(null);
      setGateBirthYear('');
      navigateAfterUnlock(unlockId);
    } catch (err: any) {
      setGateError(err.message || 'Verification failed');
    } finally {
      setGateLoading(false);
    }
  };

  const handleSensitiveConfirm = () => {
    if (!gateModal || gateModal.type !== 'sensitive' || !profile) return;
    setUnlockedLinks(prev => new Set(prev).add(gateModal.linkId));
    trackClick(gateModal.linkId, profile.id);
    if (NAVIGABLE_TYPES.has(gateModal.linkType) && gateModal.url && gateModal.url !== '#') {
      window.open(gateModal.url, '_blank', 'noopener,noreferrer');
    }
    setGateModal(null);
  };

  // Close gate modal on Escape key
  useEffect(() => {
    if (!gateModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGateModal(null);
        setGateError('');
        setGateLoading(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gateModal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-jam-red rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <h1 className="text-6xl font-serif font-bold text-ink mb-4">404</h1>
          <p className="text-slate-500 mb-6">This page doesn't exist yet.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-jam-red text-white rounded-full text-sm font-medium hover:bg-jam-red/90 transition-colors"
          >
            Create yours with Tap
          </a>
        </div>
      </div>
    );
  }

  const siteData = toSiteData(profile);
  const theme = THEMES[siteData.themeId] || THEMES.cream;
  const pageTitle = profile.seoTitle || `${profile.displayName} | Tap`;
  const pageDescription = profile.seoDescription || profile.bio || '';
  const fontClass = FONTS.find(f => f.id === siteData.fontId)?.class || 'font-serif';

  // Custom background
  const customBgStyle: React.CSSProperties = {};
  if (siteData.customBgType === 'color') {
    customBgStyle.backgroundColor = siteData.customBgColor;
  } else if (siteData.customBgType === 'gradient' && siteData.customBgUrl) {
    customBgStyle.background = siteData.customBgUrl;
  } else if (siteData.customBgType === 'image' && siteData.customBgUrl) {
    // Escape URL in CSS url() to prevent CSS injection — quote the value and escape embedded quotes/parens
    const safeUrl = siteData.customBgUrl.replace(/["'()\\]/g, '\\$&');
    customBgStyle.backgroundImage = `url("${safeUrl}")`;
    customBgStyle.backgroundSize = 'cover';
    customBgStyle.backgroundPosition = 'center';
  }
  const hasCustomBg = siteData.customBgType != null;
  const isGridLayout = siteData.layout === 'grid';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={profile.displayName || 'Tap Profile'} />
        <meta property="og:description" content={pageDescription} />
        {profile.ogImageUrl && <meta property="og:image" content={profile.ogImageUrl} />}
        {!profile.ogImageUrl && profile.avatarUrl && <meta property="og:image" content={profile.avatarUrl} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={profile.displayName || 'Tap Profile'} />
        <meta name="twitter:description" content={pageDescription} />

        {/* Favicon */}
        {profile.faviconUrl && <link rel="icon" href={profile.faviconUrl} />}

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: profile.displayName,
            description: profile.bio,
            url: window.location.href,
            image: profile.avatarUrl || undefined,
          })}
        </script>

        {/* Tracking Pixels */}
        {profile.pixels?.map((px) => {
          if (px.type === 'ga4') {
            return (
              <React.Fragment key={`px-${px.type}`}>
                <script async src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(px.pixelId)}`} />
                <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${px.pixelId.replace(/'/g, '')}');`}</script>
              </React.Fragment>
            );
          }
          if (px.type === 'meta') {
            return (
              <script key={`px-${px.type}`}>{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px.pixelId.replace(/'/g, '')}');fbq('track','PageView');`}</script>
            );
          }
          if (px.type === 'tiktok') {
            return (
              <script key={`px-${px.type}`}>{`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${px.pixelId.replace(/'/g, '')}');ttq.page()}(window,document,'ttq');`}</script>
            );
          }
          if (px.type === 'snapchat') {
            return (
              <script key={`px-${px.type}`}>{`(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${px.pixelId.replace(/'/g, '')}',{});snaptr('track','PAGE_VIEW');`}</script>
            );
          }
          return null;
        })}
      </Helmet>

      <div
        className={`min-h-screen ${!hasCustomBg ? `${theme.colors.bg} ${theme.colors.text}` : ''} ${fontClass} transition-colors duration-300 relative`}
        style={hasCustomBg ? { ...customBgStyle, color: 'inherit' } : undefined}
      >
        {/* Fluid background */}
        {siteData.showFluidBackground && (
          <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
        )}

        <div className="max-w-lg mx-auto px-4 pt-16 pb-24 relative z-10">
          <ProfileHeader siteData={siteData} theme={theme} />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={isGridLayout ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'flex flex-col gap-3'}
          >
            {siteData.links
              .filter((l) => l.active)
              .map((link) => (
                <motion.div
                  key={link.id}
                  variants={itemVariants}
                  onClick={() => handleLinkClick(link.id, link.url, link.type)}
                >
                  <BlockRenderer link={link} theme={theme} themeId={siteData.themeId} buttonStyle={siteData.buttonStyle} />
                </motion.div>
              ))}
          </motion.div>

          {/* Branding footer */}
          {!profile.removeBranding && (
            <div className="mt-16 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                  <rect x="11" y="8" width="10" height="22" rx="5" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <rect x="2" y="2" width="28" height="10" rx="5" stroke="currentColor" strokeWidth="2.5" fill="none" />
                </svg>
                Made with Tap
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Gate Modals */}
      {gateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            gateModal.type === 'email' ? 'Email verification' :
            gateModal.type === 'age' ? 'Age verification' : 'Content warning'
          }
          onClick={() => { setGateModal(null); setGateError(''); setGateLoading(false); }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-4 sm:p-6 mx-4 sm:mx-0 relative"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') { setGateModal(null); setGateError(''); setGateLoading(false); } }}
            ref={(el) => {
              if (!el) return;
              // Focus trap: keep focus within the modal
              const focusable = el.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])');
              if (focusable.length === 0) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              el.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
              });
            }}
          >
            <button
              onClick={() => { setGateModal(null); setGateError(''); setGateLoading(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Email Gate */}
            {gateModal.type === 'email' && (
              <form onSubmit={handleEmailGateSubmit}>
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center text-ink dark:text-white mb-1">Enter your email</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                  Enter your email to access "{gateModal.label}"
                </p>
                <label htmlFor="gate-email" className="sr-only">Email</label>
                <input
                  id="gate-email"
                  type="email"
                  value={gateEmail}
                  onChange={(e) => setGateEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-ink dark:text-white rounded-lg text-sm mb-2 focus:outline-none focus:border-ink dark:focus:border-slate-500"
                  autoFocus
                />
                <label htmlFor="gate-name" className="sr-only">Name (optional)</label>
                <input
                  id="gate-name"
                  type="text"
                  value={gateName}
                  onChange={(e) => setGateName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-ink dark:text-white rounded-lg text-sm mb-3 focus:outline-none focus:border-ink dark:focus:border-slate-500"
                />
                {gateError && <p className="text-xs text-red-500 mb-2">{gateError}</p>}
                <button
                  type="submit"
                  disabled={gateLoading}
                  className="w-full py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
                >
                  {gateLoading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            )}

            {/* Age Gate */}
            {gateModal.type === 'age' && (
              <form onSubmit={handleAgeGateSubmit}>
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                    <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center text-ink dark:text-white mb-1">Age Verification</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                  You must be at least {gateModal.minAge} years old to access this content.
                </p>
                <label htmlFor="gate-birth-year" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">What year were you born?</label>
                <input
                  id="gate-birth-year"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  value={gateBirthYear}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setGateBirthYear(val);
                  }}
                  placeholder="e.g. 2000"
                  maxLength={4}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-ink dark:text-white rounded-lg text-base mb-3 focus:outline-none focus:border-ink dark:focus:border-slate-500 tabular-nums tracking-widest text-center"
                  autoFocus
                />
                {gateError && <p className="text-xs text-red-500 mb-2">{gateError}</p>}
                <button
                  type="submit"
                  disabled={gateLoading}
                  className="w-full py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
                >
                  {gateLoading ? 'Verifying...' : 'Verify Age'}
                </button>
              </form>
            )}

            {/* Sensitive Content Warning */}
            {gateModal.type === 'sensitive' && (
              <div>
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center text-ink dark:text-white mb-1">Content Warning</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                  The creator has marked "{gateModal.label}" as containing sensitive content. Would you like to continue?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setGateModal(null)}
                    aria-label="Go back and do not view sensitive content"
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleSensitiveConfirm}
                    aria-label="Continue to view sensitive content"
                    className="flex-1 py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PublicProfile;
