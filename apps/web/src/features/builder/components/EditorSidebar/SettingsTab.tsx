import React, { useState, useEffect } from 'react';
import { Search, Globe, Image, Eye, EyeOff, BarChart3, Plus, Trash2 } from 'lucide-react';
import { useBuilderStore } from '../../hooks/useBuilderStore';
import QRCodeGenerator from '../QRCodeGenerator';
import { useAuthStore } from '../../../../stores/authStore';
import { toast } from '../../../../stores/toastStore';
import { apiFetch } from '../../../../lib/api';
import { uploadFile } from '../../../../lib/profileApi';
import ConfirmDialog from '@/components/ConfirmDialog';

const PIXEL_TYPES = [
  { id: 'ga4', name: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX' },
  { id: 'meta', name: 'Meta Pixel', placeholder: '1234567890' },
  { id: 'tiktok', name: 'TikTok Pixel', placeholder: 'CXXXXXXXXX' },
  { id: 'snapchat', name: 'Snapchat Pixel', placeholder: 'abc123-def456' },
];

interface PixelEntry {
  id: string;
  type: string;
  pixelId: string;
  isActive: boolean;
}

interface DomainEntry {
  id: string;
  domain: string;
  status: string;
  dnsRecords: Array<{ type: string; name: string; value: string }> | null;
  verifiedAt: string | null;
}

const SettingsTab: React.FC = () => {
  const { siteData, setSiteData, handleImageUpload, profileId, profileUsername } = useBuilderStore();
  const user = useAuthStore((s) => s.user);
  const userPlan = user?.plan || 'free';
  const isPro = userPlan === 'pro' || userPlan === 'premium';

  // Pixels state
  const [pixels, setPixels] = useState<PixelEntry[]>([]);
  const [newPixelType, setNewPixelType] = useState('ga4');
  const [newPixelId, setNewPixelId] = useState('');
  const [showPixelForm, setShowPixelForm] = useState(false);

  // Domain state
  const [domain, setDomain] = useState<DomainEntry | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);

  // Confirm dialog for destructive actions
  const [confirmRemoveDomain, setConfirmRemoveDomain] = useState(false);
  const [pixelToDelete, setPixelToDelete] = useState<string | null>(null);

  // Load pixels and domain on mount
  useEffect(() => {
    if (!profileId) return;
    apiFetch<{ pixels: PixelEntry[] }>(`/profiles/${profileId}/pixels`)
      .then(d => setPixels(d.pixels))
      .catch(() => toast.error('Failed to load tracking pixels'));
    apiFetch<{ domain: DomainEntry | null }>(`/profiles/${profileId}/domain`)
      .then(d => setDomain(d.domain))
      .catch(() => toast.error('Failed to load domain settings'));
  }, [profileId]);

  const addPixel = async () => {
    if (!profileId || !newPixelId.trim()) return;
    try {
      const { pixel } = await apiFetch<{ pixel: PixelEntry }>(`/profiles/${profileId}/pixels`, {
        method: 'POST',
        body: JSON.stringify({ type: newPixelType, pixelId: newPixelId.trim() }),
      });
      setPixels(p => [...p, pixel]);
      setNewPixelId('');
      setShowPixelForm(false);
      toast.success('Tracking pixel added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add pixel');
    }
  };

  const removePixel = async (pixelId: string) => {
    try {
      await apiFetch(`/pixels/${pixelId}`, { method: 'DELETE' });
      setPixels(p => p.filter(px => px.id !== pixelId));
      toast.success('Pixel removed');
    } catch {
      toast.error('Failed to remove pixel');
    }
    setPixelToDelete(null);
  };

  const saveDomain = async () => {
    if (!profileId || !newDomain.trim()) return;
    setDomainLoading(true);
    try {
      const { domain: d } = await apiFetch<{ domain: DomainEntry }>(`/profiles/${profileId}/domain`, {
        method: 'POST',
        body: JSON.stringify({ domain: newDomain.trim().toLowerCase() }),
      });
      setDomain(d);
      setNewDomain('');
      toast.success('Domain added — configure DNS to verify');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save domain');
    }
    setDomainLoading(false);
  };

  const verifyDomain = async () => {
    if (!profileId) return;
    setDomainLoading(true);
    try {
      const { domain: d } = await apiFetch<{ domain: DomainEntry }>(`/profiles/${profileId}/domain/verify`, {
        method: 'POST',
      });
      setDomain(d);
      if (d.status === 'verified') {
        toast.success('Domain verified!');
      } else {
        toast.warning('DNS not yet propagated. Try again in a few minutes.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    }
    setDomainLoading(false);
  };

  const removeDomain = async () => {
    if (!profileId) return;
    setConfirmRemoveDomain(false);
    try {
      await apiFetch(`/profiles/${profileId}/domain`, { method: 'DELETE' });
      setDomain(null);
      toast.success('Domain removed');
    } catch {
      toast.error('Failed to remove domain');
    }
  };

  return (
    <div className="space-y-8">
      {/* SEO */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Search size={14} /> SEO & Social
        </h3>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-ink dark:text-white">Meta Title</label>
            <span className={`text-[10px] ${siteData.seo.title.length > 60 ? 'text-amber-500' : 'text-slate-400'}`}>{siteData.seo.title.length}/60</span>
          </div>
          <input
            value={siteData.seo.title}
            onChange={(e) => setSiteData({ seo: { ...siteData.seo, title: e.target.value } })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-ink dark:focus:border-slate-400 transition-colors text-ink dark:text-white"
            placeholder="Page Title"
          />
          {siteData.seo.title.length > 60 && <p className="text-[10px] text-amber-500 mt-0.5">Titles over 60 characters may be truncated in search results</p>}
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-ink dark:text-white">Meta Description</label>
            <span className={`text-[10px] ${siteData.seo.description.length > 160 ? 'text-amber-500' : 'text-slate-400'}`}>{siteData.seo.description.length}/160</span>
          </div>
          <textarea
            value={siteData.seo.description}
            onChange={(e) => setSiteData({ seo: { ...siteData.seo, description: e.target.value } })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-ink dark:focus:border-slate-400 transition-colors h-24 resize-none text-ink dark:text-white"
            placeholder="Description for search engines..."
          />
          {siteData.seo.description.length > 160 && <p className="text-[10px] text-amber-500 mt-0.5">Descriptions over 160 characters may be truncated in search results</p>}
        </div>

        {/* OG Image */}
        <div>
          <label className="block text-xs font-medium text-ink mb-2">Social Share Image (OG Image)</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-14 rounded border border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden">
              {siteData.ogImageUrl ? (
                <img src={siteData.ogImageUrl} alt="OG" className="w-full h-full object-cover" />
              ) : (
                <Image size={20} className="text-slate-300" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const { url } = await uploadFile(file);
                        setSiteData({ ogImageUrl: url });
                      } catch {
                        const reader = new FileReader();
                        reader.onloadend = () => setSiteData({ ogImageUrl: reader.result as string });
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                />
              </label>
              {siteData.ogImageUrl && (
                <button onClick={() => setSiteData({ ogImageUrl: null })} className="text-[10px] text-red-500 hover:text-red-600">
                  Remove
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">1200x630px recommended. Shown when your page is shared on social media.</p>
        </div>

        {/* Favicon */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-medium text-ink mb-2">Favicon</label>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded border border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden">
              {siteData.favicon ? (
                <img src={siteData.favicon} alt="Favicon" className="w-8 h-8 object-contain" />
              ) : (
                <Globe size={20} className="text-slate-300" />
              )}
            </div>
            <label className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
              Upload Icon
              <input
                type="file"
                accept="image/x-icon,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'favicon');
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Google Search Preview */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Google Search Preview</div>
        <div className="font-sans">
          <div className="flex items-center gap-2 mb-1">
            {siteData.favicon ? (
              <img src={siteData.favicon} className="w-4 h-4 rounded-full" alt="" />
            ) : (
              <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[8px] text-slate-500">
                {siteData.avatarInitials}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs text-slate-700 font-medium">tap.bio</span>
              <span className="text-[10px] text-slate-400">https://tap.bio/{profileUsername || siteData.name.toLowerCase().replace(/\s/g, '')}</span>
            </div>
          </div>
          <h4 className="text-blue-700 text-lg hover:underline cursor-pointer truncate">
            {siteData.seo.title || siteData.name}
          </h4>
          <p className="text-sm text-slate-600 line-clamp-2">
            {siteData.seo.description || siteData.bio}
          </p>
        </div>
      </div>

      {/* Remove Branding */}
      <div className="pt-6 border-t border-slate-100">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-ink flex items-center gap-2">
              {siteData.removeBranding ? <EyeOff size={14} /> : <Eye size={14} />}
              Remove Branding
            </div>
            <div className="text-xs text-slate-500">Hide "Built with Tap" footer</div>
            {!isPro && <div className="text-[10px] text-amber-600">Pro plan required</div>}
          </div>
          <input
            type="checkbox"
            checked={siteData.removeBranding || false}
            onChange={(e) => setSiteData({ removeBranding: e.target.checked })}
            disabled={!isPro}
            className="w-5 h-5 accent-jam-red disabled:opacity-40"
          />
        </label>
      </div>

      {/* Custom Domain */}
      <div className="space-y-3 pt-6 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Globe size={14} /> Custom Domain
          {!isPro && <span className="text-[10px] text-amber-600 normal-case font-normal">(Pro+)</span>}
        </h3>

        {domain ? (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{domain.domain}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                domain.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>{domain.status}</span>
            </div>
            {domain.status === 'pending' && domain.dnsRecords && (
              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-medium">Add this DNS record:</p>
                {domain.dnsRecords.map((r, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-ink dark:text-white">
                    {r.type} → {r.value}
                  </div>
                ))}
                <button onClick={verifyDomain} disabled={domainLoading} className="text-xs text-jam-red hover:underline">
                  {domainLoading ? 'Verifying...' : 'Verify DNS'}
                </button>
              </div>
            )}
            <button onClick={() => setConfirmRemoveDomain(true)} className="text-[10px] text-red-500 hover:text-red-600">
              Remove Domain
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="custom-domain-input" className="sr-only">Custom domain</label>
            <input
              id="custom-domain-input"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="yourdomain.com"
              disabled={!isPro}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-ink disabled:opacity-40"
            />
            <button
              onClick={saveDomain}
              disabled={!isPro || !newDomain.trim() || domainLoading}
              aria-label="Add custom domain"
              className="px-3 py-2 bg-ink text-white rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-ink/90"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Tracking Pixels */}
      <div className="space-y-3 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 size={14} /> Tracking Pixels
            {!isPro && <span className="text-[10px] text-amber-600 normal-case font-normal">(Pro+)</span>}
          </h3>
          {isPro && PIXEL_TYPES.some(pt => !pixels.find(p => p.type === pt.id)) && (
            <button onClick={() => {
              const available = PIXEL_TYPES.filter(pt => !pixels.find(p => p.type === pt.id));
              if (available.length > 0) setNewPixelType(available[0].id);
              setShowPixelForm(!showPixelForm);
            }} className="text-xs text-jam-red hover:underline flex items-center gap-1">
              <Plus size={12} /> Add
            </button>
          )}
        </div>

        {showPixelForm && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <select
              value={newPixelType}
              onChange={(e) => setNewPixelType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            >
              {PIXEL_TYPES.filter(pt => !pixels.find(p => p.type === pt.id)).map(pt => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
            <input
              value={newPixelId}
              onChange={(e) => setNewPixelId(e.target.value)}
              placeholder={PIXEL_TYPES.find(p => p.id === newPixelType)?.placeholder || 'Pixel ID'}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={addPixel} className="px-3 py-1.5 bg-ink text-white rounded-lg text-xs font-medium">Save</button>
              <button onClick={() => setShowPixelForm(false)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">Cancel</button>
            </div>
          </div>
        )}

        {pixels.length > 0 ? (
          <div className="space-y-2">
            {pixels.map(px => {
              const meta = PIXEL_TYPES.find(p => p.id === px.type);
              return (
                <div key={px.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <div className="text-xs font-medium text-ink">{meta?.name || px.type}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{px.pixelId}</div>
                  </div>
                  <button onClick={() => setPixelToDelete(px.id)} className="text-slate-400 hover:text-red-500" aria-label={`Remove ${meta?.name || 'pixel'}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          !showPixelForm && <p className="text-xs text-slate-400">No tracking pixels configured.</p>
        )}
      </div>

      {/* QR Code */}
      <div className="pt-6 border-t border-slate-100">
        <QRCodeGenerator />
      </div>

      <ConfirmDialog
        open={confirmRemoveDomain}
        title="Remove Domain"
        message={`Remove "${domain?.domain}"? Your profile will no longer be accessible via this domain.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={removeDomain}
        onCancel={() => setConfirmRemoveDomain(false)}
      />

      <ConfirmDialog
        open={!!pixelToDelete}
        title="Remove Pixel"
        message="Remove this tracking pixel? You'll stop collecting data from it immediately."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => pixelToDelete && removePixel(pixelToDelete)}
        onCancel={() => setPixelToDelete(null)}
      />
    </div>
  );
};

export default SettingsTab;
