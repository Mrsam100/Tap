const API_BASE = '/api/public/track';

function getVisitorId(): string {
  const KEY = 'tap_vid';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
    localStorage.setItem(KEY, id);
  }
  return id;
}

function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  const src = params.get('utm_source');
  const med = params.get('utm_medium');
  const camp = params.get('utm_campaign');
  if (src) result.utmSource = src;
  if (med) result.utmMedium = med;
  if (camp) result.utmCampaign = camp;
  return result;
}

function beacon(path: string, data: Record<string, unknown>): void {
  const body = JSON.stringify(data);
  // Use sendBeacon for reliability (survives page unload), fall back to fetch
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const sent = navigator.sendBeacon(`${API_BASE}${path}`, blob);
    if (sent) return;
  }
  fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function trackPageView(profileId: string): void {
  beacon('/pageview', {
    profileId,
    visitorId: getVisitorId(),
    referrer: document.referrer || undefined,
    ...getUtmParams(),
  });
}

export function trackClick(linkId: string, profileId: string): void {
  beacon('/click', {
    linkId,
    profileId,
    visitorId: getVisitorId(),
    referrer: document.referrer || undefined,
  });
}

export function trackEngagement(profileId: string): () => void {
  let sent = false;
  const startTime = Date.now();

  function getScrollDepth(): number {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return 100;
    return Math.min(100, Math.round((window.scrollY / scrollHeight) * 100));
  }

  let maxScroll = 0;
  function onScroll() {
    const depth = getScrollDepth();
    if (depth > maxScroll) maxScroll = depth;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  function sendEngagement() {
    if (sent) return;
    sent = true;
    const timeOnPage = Math.round((Date.now() - startTime) / 1000);
    if (timeOnPage < 2 && maxScroll === 0) return;
    beacon('/engagement', {
      profileId,
      visitorId: getVisitorId(),
      scrollDepth: maxScroll,
      timeOnPage,
    });
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') sendEngagement();
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', sendEngagement);

  // Cleanup: remove ALL listeners
  return () => {
    sendEngagement();
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', sendEngagement);
  };
}
