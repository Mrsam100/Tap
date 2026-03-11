import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  User,
  Shield,
  Globe,
  Search as SearchIcon,
  Code,
  CreditCard,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Plus,
  ExternalLink,
  RefreshCw,
  Key,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../src/stores/authStore';
import { apiFetch } from '../src/lib/api';
import { fetchApiKeys, createApiKey, deleteApiKey } from '../src/lib/apiKeysApi';
import { toast } from '../src/stores/toastStore';
import ConfirmDialog from '../components/ConfirmDialog';
import type { ApiProfile, ApiKey } from '@tap/shared';

interface DashboardContext {
  profiles: ApiProfile[];
  activeProfile: ApiProfile | undefined;
}

type SettingsTab = 'profile' | 'account' | 'seo' | 'domain' | 'billing' | 'api';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Shield },
  { id: 'seo', label: 'SEO', icon: SearchIcon },
  { id: 'domain', label: 'Domain', icon: Globe },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'api', label: 'API', icon: Code },
];

const Settings: React.FC = () => {
  const { activeProfile } = useOutletContext<DashboardContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as SettingsTab) || 'profile';

  const setTab = (tab: SettingsTab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-ink dark:text-white mb-6">Settings</h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors min-h-[44px] ${
              activeTab === tab.id
                ? 'text-jam-red border-b-2 border-jam-red bg-jam-red/5 dark:bg-jam-red/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div key={activeTab} className="animate-fade-up">
        {activeTab === 'profile' && <ProfileTab profile={activeProfile} />}
        {activeTab === 'account' && <AccountTab />}
        {activeTab === 'seo' && <SeoTab profile={activeProfile} />}
        {activeTab === 'domain' && <DomainTab profile={activeProfile} />}
        {activeTab === 'billing' && <BillingTab />}
        {activeTab === 'api' && <ApiTab />}
      </div>
    </div>
  );
};

// ── Profile Tab ───────────────────────────────────────────────────
const ProfileTab: React.FC<{ profile?: ApiProfile }> = ({ profile }) => {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await apiFetch(`/profiles/${profile.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ displayName, bio }),
      });
      setSaved(true);
      toast.success('Profile updated');
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <EmptyState message="No profile selected" />;

  return (
    <SettingsSection title="Profile Information" description="Update your public profile details.">
      <div className="space-y-4">
        <Field label="Display Name">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            className="settings-input"
          />
        </Field>
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            className="settings-input resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">{bio.length}/500</p>
        </Field>
        <Field label="Username">
          <input
            type="text"
            value={profile.username}
            disabled
            className="settings-input opacity-50 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">Username cannot be changed</p>
        </Field>
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </SettingsSection>
  );
};

// ── Account Tab ───────────────────────────────────────────────────
const AccountTab: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async () => {
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      const msg = e.message || 'Failed to change password';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <SettingsSection title="Account Details" description="Your account information.">
        <div className="space-y-4">
          <Field label="Email">
            <input type="email" value={user?.email || ''} disabled className="settings-input opacity-50 cursor-not-allowed" />
          </Field>
          <Field label="Email Verified">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user?.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {user?.emailVerified ? 'Verified' : 'Not verified'}
              </span>
            </div>
          </Field>
          <Field label="MFA Status">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user?.mfaEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection title="Change Password" description="Update your account password.">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          <Field label="Current Password">
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="settings-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="New Password">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="settings-input"
              minLength={8}
            />
          </Field>
          <Field label="Confirm New Password">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="settings-input"
            />
          </Field>
          <SaveButton label="Change Password" saving={saving} saved={saved} onClick={handleChangePassword} disabled={!currentPassword || !newPassword} />
        </div>
      </SettingsSection>

      <SettingsSection title="Danger Zone" description="Irreversible account actions.">
        <div className="border border-red-200 dark:border-red-800/50 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Once you delete your account, there is no going back. All your profiles, links, and data will be permanently deleted.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Type <strong className="text-red-600">delete my account</strong> to confirm:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="delete my account"
              className="settings-input flex-1"
            />
            <button
              onClick={async () => {
                if (deleteConfirm !== 'delete my account') return;
                setDeleting(true);
                try {
                  await apiFetch('/auth/delete-account', { method: 'POST' });
                  toast.info('Account deleted. Goodbye!');
                  await logout();
                  window.location.href = '/';
                } catch (e: any) {
                  toast.error(e.message || 'Failed to delete account');
                  setDeleting(false);
                }
              }}
              disabled={deleteConfirm !== 'delete my account' || deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

// ── SEO Tab ───────────────────────────────────────────────────────
const SeoTab: React.FC<{ profile?: ApiProfile }> = ({ profile }) => {
  const [seoTitle, setSeoTitle] = useState(profile?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(profile?.seoDescription || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setSeoTitle(profile.seoTitle || '');
      setSeoDescription(profile.seoDescription || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await apiFetch(`/profiles/${profile.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ seoTitle, seoDescription }),
      });
      setSaved(true);
      toast.success('SEO settings saved');
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <EmptyState message="No profile selected" />;

  return (
    <SettingsSection title="Search Engine Optimization" description="Control how your profile appears in search results and social media previews.">
      <div className="space-y-4">
        <Field label="Meta Title">
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            maxLength={200}
            placeholder={profile.displayName || profile.username}
            className="settings-input"
          />
          <p className="text-xs text-slate-400 mt-1">{seoTitle.length}/200 characters</p>
        </Field>
        <Field label="Meta Description">
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="A brief description of your profile..."
            className="settings-input resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">{seoDescription.length}/500 characters</p>
        </Field>

        {/* Preview Card */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Search Preview</p>
          <div className="space-y-1">
            <p className="text-blue-600 dark:text-blue-400 text-base font-medium truncate" title={seoTitle || profile.displayName || profile.username}>
              {seoTitle || profile.displayName || profile.username}
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-500">
              tap.bio/{profile.username}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {seoDescription || `${profile.displayName || profile.username}'s profile on Tap`}
            </p>
          </div>
        </div>

        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </SettingsSection>
  );
};

// ── Domain Tab ────────────────────────────────────────────────────
const DomainTab: React.FC<{ profile?: ApiProfile }> = ({ profile }) => {
  const [domain, setDomain] = useState('');
  const [domainData, setDomainData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const loadDomain = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await apiFetch<{ domain: any }>(`/profiles/${profile.id}/domain`);
      setDomainData(data.domain);
    } catch {
      setDomainData(null);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) loadDomain();
  }, [profile, loadDomain]);

  const handleAdd = async () => {
    if (!profile || !domain.trim()) return;
    setLoading(true);
    try {
      await apiFetch(`/profiles/${profile.id}/domain`, {
        method: 'POST',
        body: JSON.stringify({ domain: domain.trim() }),
      });
      setDomain('');
      toast.success('Domain added. Configure DNS records below.');
      await loadDomain();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!profile) return;
    setVerifying(true);
    try {
      const result = await apiFetch<{ domain: any }>(`/profiles/${profile.id}/domain/verify`, { method: 'POST' });
      await loadDomain();
      if (result.domain?.status === 'verified') {
        toast.success('Domain verified successfully!');
      } else {
        toast.info('DNS records not yet propagated. Try again in a few minutes.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleRemove = async () => {
    if (!profile) return;
    try {
      await apiFetch(`/profiles/${profile.id}/domain`, { method: 'DELETE' });
      setDomainData(null);
      setConfirmRemove(false);
      toast.success('Domain removed');
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove domain');
      setConfirmRemove(false);
    }
  };

  if (!profile) return <EmptyState message="No profile selected" />;

  return (
    <SettingsSection title="Custom Domain" description="Connect your own domain to your Tap profile.">
      {domainData ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-ink dark:text-white">{domainData.domain}</p>
              <p className={`text-xs mt-0.5 ${domainData.status === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {domainData.status === 'verified' ? 'Verified & Active' : 'Pending Verification'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {domainData.status !== 'verified' && (
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <RefreshCw size={14} className={verifying ? 'animate-spin' : ''} />
                  Verify
                </button>
              )}
              <button
                onClick={() => setConfirmRemove(true)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                aria-label="Remove domain"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {domainData.status !== 'verified' && domainData.dnsRecords && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                DNS Configuration
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Add the following CNAME record to your domain's DNS settings:
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2">
                  <div><span className="text-slate-400">Type:</span> CNAME</div>
                  <div><span className="text-slate-400">Name:</span> @</div>
                  <div className="break-all"><span className="text-slate-400">Value:</span> proxy.tap.bio</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Domain">
            <div className="flex gap-2">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourdomain.com"
                className="settings-input flex-1"
              />
              <button
                onClick={handleAdd}
                disabled={loading || !domain.trim()}
                className="px-4 py-2 bg-ink dark:bg-white text-white dark:text-ink rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </Field>
        </div>
      )}
      <ConfirmDialog
        open={confirmRemove}
        title="Remove Domain"
        message={`Are you sure you want to remove "${domainData?.domain || 'this domain'}"? Your profile will no longer be accessible via this domain.`}
        confirmLabel="Remove Domain"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </SettingsSection>
  );
};

// ── Billing Tab ───────────────────────────────────────────────────
const BillingTab: React.FC = () => {
  const { user } = useAuthStore();
  const [portalLoading, setPortalLoading] = useState(false);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const data = await apiFetch<{ url: string }>('/billing/portal', { method: 'POST' });
      window.open(data.url, '_blank');
    } catch (e: any) {
      toast.error(e.message || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const planFeatures: Record<string, string[]> = {
    free: ['1 profile', '5 links', 'Basic analytics', 'Tap branding'],
    pro: ['Unlimited links', 'Advanced analytics', 'Custom domain', 'Remove branding', 'CSV export', 'API access'],
    business: ['Everything in Pro', 'Priority support', 'Team collaboration', 'Custom themes'],
  };

  return (
    <SettingsSection title="Billing & Plan" description="Manage your subscription and billing details.">
      <div className="space-y-6">
        {/* Current Plan */}
        <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Current Plan</p>
              <p className="text-xl font-bold text-ink dark:text-white capitalize">{user?.plan || 'Free'}</p>
            </div>
            {user?.plan === 'free' && (
              <a
                href="/pricing"
                className="px-4 py-2 bg-jam-red text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Upgrade
              </a>
            )}
          </div>
          <ul className="space-y-1.5">
            {(planFeatures[user?.plan || 'free'] || planFeatures.free).map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Check size={14} className="text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Billing Portal */}
        {user?.plan !== 'free' && (
          <button
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink size={16} />
            {portalLoading ? 'Opening...' : 'Manage Billing in Stripe'}
          </button>
        )}
      </div>
    </SettingsSection>
  );
};

// ── API Tab ───────────────────────────────────────────────────────
const ApiTab: React.FC = () => {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApiKeys();
      setKeys(data.keys);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.plan !== 'free') loadKeys();
  }, [user, loadKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const data = await createApiKey(newKeyName.trim());
      setRevealedKey(data.key);
      setNewKeyName('');
      toast.success('API key created');
      await loadKeys();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteApiKey(keyToDelete.id);
      toast.success(`API key "${keyToDelete.name}" deleted`);
      setKeyToDelete(null);
      await loadKeys();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete API key');
      setKeyToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyKey = () => {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (user?.plan === 'free') {
    return (
      <SettingsSection title="API Access" description="Programmatically manage your profile with the Tap API.">
        <div className="text-center py-8">
          <Key size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            API access is available on Pro and Business plans.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-jam-red text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title="API Keys" description="Create and manage API keys for programmatic access.">
      <div className="space-y-4">
        {/* Revealed Key Banner */}
        {revealedKey && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                Save this key now. It won't be shown again.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded text-xs font-mono text-ink dark:text-white border border-amber-200 dark:border-slate-700 break-all">
                {revealedKey}
              </code>
              <button
                onClick={copyKey}
                className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-amber-600" />}
              </button>
            </div>
          </div>
        )}

        {/* Create New Key */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production)"
            maxLength={100}
            autoFocus
            className="settings-input flex-1"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newKeyName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-ink dark:bg-white text-white dark:text-ink rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>

        {/* Key List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No API keys yet</p>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">{key.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <code>{key.prefix}...</code>
                    {key.lastUsed && ` | Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                    {` | Created: ${new Date(key.createdAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => setKeyToDelete(key)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  aria-label={`Delete API key ${key.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* API Docs Link */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400">
            Base URL: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-ink dark:text-white">
              {window.location.origin}/api/v1
            </code>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate with: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-ink dark:text-white">
              Authorization: Bearer tap_live_xxx
            </code>
          </p>
        </div>

        <ConfirmDialog
          open={!!keyToDelete}
          title="Delete API Key"
          message={`Are you sure you want to delete "${keyToDelete?.name}"? Any integrations using this key will stop working immediately.`}
          confirmLabel="Delete Key"
          variant="danger"
          loading={deleteLoading}
          onConfirm={handleDeleteKey}
          onCancel={() => setKeyToDelete(null)}
        />
      </div>
    </SettingsSection>
  );
};

// ── Shared Components ─────────────────────────────────────────────

const SettingsSection: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
    <h2 className="text-lg font-semibold text-ink dark:text-white mb-1">{title}</h2>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{description}</p>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
    {children}
  </div>
);

const SaveButton: React.FC<{
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}> = ({ saving, saved, onClick, label = 'Save Changes', disabled }) => (
  <button
    onClick={onClick}
    disabled={saving || disabled}
    className="flex items-center gap-2 px-5 py-2.5 bg-ink dark:bg-white text-white dark:text-ink rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
  >
    {saving ? 'Saving...' : saved ? (
      <>
        <Check size={16} />
        Saved
      </>
    ) : label}
  </button>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-12">
    <p className="text-sm text-slate-400">{message}</p>
  </div>
);

export default Settings;
