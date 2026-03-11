import { create } from 'zustand';
import type { SiteData, ContentBlock, BlockType, LinkStyle, SocialPlatform, ApiProfileFull, ButtonStyleConfig } from '@tap/shared';
import * as profileApi from '../../../lib/profileApi';
import { toast } from '../../../stores/toastStore';

const STORAGE_KEY = 'tap_builder_data_v2';
let _idCounter = 0;
const uniqueId = () => `${Date.now()}-${++_idCounter}`;

// ── localStorage helpers (offline cache) ───────────────────────────

function readLocalStorage(): SiteData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse saved data', e);
  }
  return null;
}

function writeLocalStorage(data: SiteData) {
  try {
    if (data.name) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch { /* quota exceeded — fail silently */ }
}

const DEFAULT_BUTTON_STYLE: ButtonStyleConfig = {
  shape: 'rounded',
  fill: 'solid',
  shadow: 'none',
  color: '',
};

const DEFAULT_SITE_DATA: SiteData = {
  name: '',
  bio: '',
  links: [],
  socials: [],
  avatarImage: null,
  favicon: null,
  themeId: 'cream',
  fontId: 'serif',
  showFluidBackground: false,
  avatarInitials: '',
  seo: { title: '', description: '' },
  buttonStyle: { ...DEFAULT_BUTTON_STYLE },
  layout: 'stack',
  customBgType: null,
  customBgColor: '#6366f1',
  customBgUrl: null,
  ogImageUrl: null,
  removeBranding: false,
};

// ── Mappers: API ↔ SiteData ────────────────────────────────────────

function profileToSiteData(profile: ApiProfileFull): SiteData {
  const bs = profile.buttonStyle as Record<string, unknown> | null;
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
    buttonStyle: {
      shape: (bs?.shape as ButtonStyleConfig['shape']) || 'rounded',
      fill: (bs?.fill as ButtonStyleConfig['fill']) || 'solid',
      shadow: (bs?.shadow as string) || 'none',
      color: (bs?.color as string) || '',
    },
    layout: profile.layout || 'stack',
    customBgType: profile.customBgType || null,
    customBgColor: profile.customBgColor || '#6366f1',
    customBgUrl: profile.customBgUrl || null,
    ogImageUrl: profile.ogImageUrl || null,
    removeBranding: profile.removeBranding ?? false,
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
      // Access control fields
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
  };
}

function siteDataToProfilePatch(data: Partial<SiteData>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.displayName = data.name;
  if (data.bio !== undefined) patch.bio = data.bio;
  if (data.avatarImage !== undefined) patch.avatarUrl = data.avatarImage;
  if (data.favicon !== undefined) patch.faviconUrl = data.favicon;
  if (data.themeId !== undefined) patch.themeId = data.themeId;
  if (data.fontId !== undefined) patch.fontId = data.fontId;
  if (data.showFluidBackground !== undefined) patch.showFluidBg = data.showFluidBackground;
  if (data.seo) {
    if (data.seo.title !== undefined) patch.seoTitle = data.seo.title;
    if (data.seo.description !== undefined) patch.seoDescription = data.seo.description;
  }
  if (data.buttonStyle !== undefined) patch.buttonStyle = data.buttonStyle;
  if (data.layout !== undefined) patch.layout = data.layout;
  if (data.customBgType !== undefined) patch.customBgType = data.customBgType;
  if (data.customBgColor !== undefined) patch.customBgColor = data.customBgColor;
  if (data.customBgUrl !== undefined) patch.customBgUrl = data.customBgUrl;
  if (data.ogImageUrl !== undefined) patch.ogImageUrl = data.ogImageUrl;
  if (data.removeBranding !== undefined) patch.removeBranding = data.removeBranding;
  return patch;
}

function contentBlockToLinkPatch(block: Partial<ContentBlock>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (block.type !== undefined) patch.type = block.type;
  if (block.label !== undefined) patch.label = block.label;
  if (block.url !== undefined) patch.url = block.url;
  if (block.active !== undefined) patch.isActive = block.active;
  if (block.image !== undefined) patch.thumbnailUrl = block.image;
  if (block.style) patch.style = block.style;

  const metadata: Record<string, unknown> = {};
  if (block.price !== undefined) metadata.price = block.price;
  if (block.embedUrl !== undefined) metadata.embedUrl = block.embedUrl;
  if (block.countdownDate !== undefined) metadata.countdownDate = block.countdownDate;
  if (Object.keys(metadata).length > 0) patch.metadata = metadata;

  // Access control fields
  if (block.scheduledStart !== undefined) patch.scheduledStart = block.scheduledStart;
  if (block.scheduledEnd !== undefined) patch.scheduledEnd = block.scheduledEnd;
  if (block.ageGate !== undefined) patch.ageGate = block.ageGate;
  if (block.minAge !== undefined) patch.minAge = block.minAge;
  if (block.sensitive !== undefined) patch.sensitive = block.sensitive;
  if (block.emailGate !== undefined) patch.emailGate = block.emailGate;

  return patch;
}

// ── Store ──────────────────────────────────────────────────────────

export interface BuilderState {
  // Data
  siteData: SiteData;
  profileId: string | null;
  profileUsername: string | null;

  // Sync state
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  isLoadingProfile: boolean;

  // UI State
  stage: 'input' | 'loading' | 'editor';
  activeTab: 'content' | 'design' | 'settings';
  previewDevice: 'mobile' | 'desktop';
  isPublished: boolean;
  isOffline: boolean;
  isAIProcessing: boolean;
  draggedItemIndex: number | null;

  // API-backed Data Actions
  setSiteData: (data: Partial<SiteData>) => void;
  replaceSiteData: (data: SiteData) => void;
  updateLink: (id: string, field: string, value: any) => void;
  addBlock: (type: BlockType) => void;
  removeLink: (id: string) => void;
  addSocial: (platformId: SocialPlatform) => void;
  removeSocial: (id: string) => void;
  updateSocial: (id: string, url: string) => void;
  reorderLinks: (fromIndex: number, toIndex: number) => void;
  handleImageUpload: (file: File, field: 'avatarImage' | 'favicon') => void;

  // UI Actions
  setStage: (stage: BuilderState['stage']) => void;
  setActiveTab: (tab: BuilderState['activeTab']) => void;
  setPreviewDevice: (device: BuilderState['previewDevice']) => void;
  setIsPublished: (published: boolean) => void;
  setIsOffline: (offline: boolean) => void;
  setIsAIProcessing: (processing: boolean) => void;
  setDraggedItemIndex: (index: number | null) => void;

  // Persistence
  loadProfile: () => Promise<void>;
  createProfileFromSiteData: (data: SiteData) => Promise<void>;
  saveToStorage: () => void;
  clonePage: () => void;
  publishToggle: () => Promise<void>;
}

// Debounced API sync — single timer for profile-level patches
let _profileSyncTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingProfilePatch: Record<string, unknown> = {};

function debouncedProfileSync(profileId: string, data: Record<string, unknown>, set: Function) {
  // Accumulate patches
  _pendingProfilePatch = { ..._pendingProfilePatch, ...data };

  if (_profileSyncTimer) clearTimeout(_profileSyncTimer);
  _profileSyncTimer = setTimeout(async () => {
    const patch = { ..._pendingProfilePatch };
    _pendingProfilePatch = {};
    if (Object.keys(patch).length === 0) return;

    set({ isSyncing: true, syncError: null });
    try {
      await profileApi.updateProfile(profileId, patch);
      set({ isSyncing: false, lastSyncedAt: new Date() });
    } catch (err: any) {
      console.error('Profile sync failed:', err);
      set({ isSyncing: false, syncError: err.message || 'Sync failed' });
      toast.error('Changes couldn\u2019t be saved. Check your connection.');
    }
  }, 1000);
}

// Debounced link sync — per-link timers
const _linkSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedLinkSync(linkId: string, data: Record<string, unknown>, set: Function) {
  const existing = _linkSyncTimers.get(linkId);
  if (existing) clearTimeout(existing);

  _linkSyncTimers.set(linkId, setTimeout(async () => {
    _linkSyncTimers.delete(linkId);
    if (Object.keys(data).length === 0) return;

    set({ isSyncing: true });
    try {
      await profileApi.updateLink(linkId, data);
      set({ isSyncing: false, lastSyncedAt: new Date() });
    } catch (err: any) {
      console.error('Link sync failed:', err);
      set({ isSyncing: false, syncError: err.message });
      toast.error('Link changes couldn\u2019t be saved.');
    }
  }, 1000));
}

// Debounced social sync
const _socialSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedSocialSync(socialId: string, data: { url?: string }, set: Function) {
  const existing = _socialSyncTimers.get(socialId);
  if (existing) clearTimeout(existing);

  _socialSyncTimers.set(socialId, setTimeout(async () => {
    _socialSyncTimers.delete(socialId);
    try {
      await profileApi.updateSocial(socialId, data);
    } catch (err) {
      console.error('Social sync failed:', err);
      toast.error('Social link couldn\u2019t be saved.');
    }
  }, 1000));
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  siteData: DEFAULT_SITE_DATA,
  profileId: null,
  profileUsername: null,

  isSyncing: false,
  lastSyncedAt: null,
  syncError: null,
  isLoadingProfile: false,

  stage: 'input',
  activeTab: 'content',
  previewDevice: 'mobile',
  isPublished: false,
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  isAIProcessing: false,
  draggedItemIndex: null,

  // ── Load profile from API (or localStorage fallback) ─────────

  loadProfile: async () => {
    set({ isLoadingProfile: true });

    try {
      const { profiles } = await profileApi.fetchProfiles();

      if (profiles.length > 0) {
        const { profile } = await profileApi.fetchProfile(profiles[0].id);
        const siteData = profileToSiteData(profile);

        set({
          profileId: profile.id,
          profileUsername: profile.username,
          siteData,
          stage: 'editor',
          isPublished: profile.isPublished ?? false,
          isLoadingProfile: false,
        });

        writeLocalStorage(siteData);
        return;
      }
    } catch (err) {
      console.warn('API fetch failed, trying localStorage:', err);
    }

    // Fallback: try localStorage
    const local = readLocalStorage();
    if (local && local.name) {
      set({
        siteData: local,
        stage: 'editor',
        isLoadingProfile: false,
      });
    } else {
      set({ isLoadingProfile: false, stage: 'input' });
    }
  },

  // ── Create profile from generated SiteData ───────────────────

  createProfileFromSiteData: async (data: SiteData) => {
    try {
      const { profile } = await profileApi.createProfile({
        displayName: data.name,
        bio: data.bio,
        themeId: data.themeId,
        fontId: data.fontId,
      });

      // Update extra fields (avatar, seo, etc.)
      const extraFields = siteDataToProfilePatch(data);
      if (Object.keys(extraFields).length > 0) {
        await profileApi.updateProfile(profile.id, extraFields);
      }

      // Create links sequentially to preserve order
      for (const block of data.links) {
        const metadata: Record<string, unknown> = {};
        if (block.price) metadata.price = block.price;
        if (block.embedUrl) metadata.embedUrl = block.embedUrl;
        if (block.countdownDate) metadata.countdownDate = block.countdownDate;

        const linkData: {
          type: string;
          label?: string;
          url?: string;
          style?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        } = {
          type: block.type,
          label: block.label,
          url: block.url,
          style: block.style as unknown as Record<string, unknown>,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        };
        // Include access control fields in metadata
        const accessControl: Record<string, unknown> = {};
        if (block.scheduledStart) accessControl.scheduledStart = block.scheduledStart;
        if (block.scheduledEnd) accessControl.scheduledEnd = block.scheduledEnd;
        if (block.ageGate) accessControl.ageGate = block.ageGate;
        if (block.minAge) accessControl.minAge = block.minAge;
        if (block.sensitive) accessControl.sensitive = block.sensitive;
        if (block.emailGate) accessControl.emailGate = block.emailGate;
        if (Object.keys(accessControl).length > 0) {
          linkData.metadata = { ...linkData.metadata, ...accessControl };
        }

        await profileApi.createLink(profile.id, linkData);
      }

      // Create socials
      for (const social of data.socials) {
        if (social.url) {
          await profileApi.createSocial(profile.id, {
            platform: social.platform,
            url: social.url,
          });
        }
      }

      // Reload full profile to get server-generated IDs
      const { profile: full } = await profileApi.fetchProfile(profile.id);
      const siteData = profileToSiteData(full);

      set({
        profileId: full.id,
        profileUsername: full.username,
        siteData,
        isPublished: full.isPublished ?? false,
      });

      writeLocalStorage(siteData);
    } catch (err) {
      console.error('Failed to create profile via API:', err);
      writeLocalStorage(data);
      toast.warning('Saved locally — couldn\u2019t reach server. Changes will sync when you\u2019re back online.');
    }
  },

  // ── Data Actions ─────────────────────────────────────────────

  setSiteData: (data) => {
    set((state) => {
      const newData = { ...state.siteData, ...data };
      writeLocalStorage(newData);

      if (state.profileId && !state.isOffline) {
        const patch = siteDataToProfilePatch(data);
        if (Object.keys(patch).length > 0) {
          debouncedProfileSync(state.profileId, patch, set);
        }
      }

      return { siteData: newData };
    });
  },

  replaceSiteData: (data) => {
    set({ siteData: data });
    writeLocalStorage(data);
  },

  updateLink: (id, field, value) => {
    set((state) => {
      const newLinks = state.siteData.links.map((l) => {
        if (l.id !== id) return l;
        if (['fontSize', 'customColor', 'outline'].includes(field)) {
          return { ...l, style: { ...l.style, [field as keyof LinkStyle]: value } };
        }
        return { ...l, [field]: value };
      });
      const newData = { ...state.siteData, links: newLinks };
      writeLocalStorage(newData);

      // Sync to API
      if (state.profileId && !state.isOffline) {
        const updatedBlock = newLinks.find((l) => l.id === id);
        if (updatedBlock) {
          const patch = contentBlockToLinkPatch(
            ['fontSize', 'customColor', 'outline'].includes(field)
              ? { style: updatedBlock.style }
              : { [field]: value }
          );
          debouncedLinkSync(id, patch, set);
        }
      }

      return { siteData: newData };
    });
  },

  addBlock: (type) => {
    const state = get();
    const newBlock: ContentBlock = {
      id: uniqueId(),
      type,
      label: type === 'section' ? 'New Section' : 'New Block',
      url: '#',
      style: { fontSize: 'md', customColor: '', outline: false },
      active: true,
    };

    if (type === 'product') {
      newBlock.price = '$0.00';
      newBlock.image = '';
    } else if (type === 'video') {
      newBlock.embedUrl = '';
    } else if (type === 'timer') {
      newBlock.countdownDate = new Date(Date.now() + 86400000).toISOString();
    }

    const newData = { ...state.siteData, links: [...state.siteData.links, newBlock] };
    set({ siteData: newData });
    writeLocalStorage(newData);

    // Create via API — replace temp ID with server ID
    if (state.profileId && !state.isOffline) {
      const metadata: Record<string, unknown> = {};
      if (newBlock.price) metadata.price = newBlock.price;
      if (newBlock.embedUrl) metadata.embedUrl = newBlock.embedUrl;
      if (newBlock.countdownDate) metadata.countdownDate = newBlock.countdownDate;

      profileApi
        .createLink(state.profileId, {
          type: newBlock.type,
          label: newBlock.label,
          url: newBlock.url,
          style: newBlock.style as unknown as Record<string, unknown>,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        })
        .then(({ link }) => {
          set((s) => ({
            siteData: {
              ...s.siteData,
              links: s.siteData.links.map((l) =>
                l.id === newBlock.id ? { ...l, id: link.id } : l
              ),
            },
          }));
        })
        .catch((err) => { console.error('Failed to create link:', err); toast.error('Failed to save new block.'); });
    }
  },

  removeLink: (id) => {
    set((state) => {
      const newData = { ...state.siteData, links: state.siteData.links.filter((l) => l.id !== id) };
      writeLocalStorage(newData);

      if (state.profileId && !state.isOffline) {
        profileApi.deleteLink(id).catch((err) => { console.error('Failed to delete link:', err); toast.error('Failed to delete block. It may reappear on reload.'); });
      }

      return { siteData: newData };
    });
  },

  addSocial: (platformId) => {
    const state = get();
    if (state.siteData.socials.find((s) => s.platform === platformId)) return;

    const newSocial = { id: uniqueId(), platform: platformId, url: '' };
    const newData = { ...state.siteData, socials: [...state.siteData.socials, newSocial] };
    set({ siteData: newData });
    writeLocalStorage(newData);

    if (state.profileId && !state.isOffline) {
      profileApi
        .createSocial(state.profileId, { platform: platformId, url: '' })
        .then(({ social }) => {
          set((s) => ({
            siteData: {
              ...s.siteData,
              socials: s.siteData.socials.map((so) =>
                so.id === newSocial.id ? { ...so, id: social.id } : so
              ),
            },
          }));
        })
        .catch((err) => { console.error('Failed to create social:', err); toast.error('Failed to save social link.'); });
    }
  },

  removeSocial: (id) => {
    set((state) => {
      const newData = { ...state.siteData, socials: state.siteData.socials.filter((s) => s.id !== id) };
      writeLocalStorage(newData);

      if (state.profileId && !state.isOffline) {
        profileApi.deleteSocial(id).catch((err) => { console.error('Failed to delete social:', err); toast.error('Failed to remove social link.'); });
      }

      return { siteData: newData };
    });
  },

  updateSocial: (id, url) => {
    set((state) => {
      const newData = {
        ...state.siteData,
        socials: state.siteData.socials.map((s) => (s.id === id ? { ...s, url } : s)),
      };
      writeLocalStorage(newData);

      if (state.profileId && !state.isOffline) {
        debouncedSocialSync(id, { url }, set);
      }

      return { siteData: newData };
    });
  },

  reorderLinks: (fromIndex, toIndex) => {
    set((state) => {
      const newLinks = [...state.siteData.links];
      const draggedItem = newLinks[fromIndex];
      newLinks.splice(fromIndex, 1);
      newLinks.splice(toIndex, 0, draggedItem);
      const newData = { ...state.siteData, links: newLinks };
      writeLocalStorage(newData);

      if (state.profileId && !state.isOffline) {
        profileApi
          .reorderLinks(state.profileId, newLinks.map((l) => l.id))
          .catch((err) => { console.error('Reorder failed:', err); toast.error('Failed to save new order.'); });
      }

      return { siteData: newData, draggedItemIndex: toIndex };
    });
  },

  handleImageUpload: (file, field) => {
    const state = get();

    if (state.profileId && !state.isOffline) {
      const uploadFn = field === 'avatarImage' ? profileApi.uploadAvatar : profileApi.uploadFile;
      uploadFn(file)
        .then(({ url }) => {
          set((s) => {
            const newData = { ...s.siteData, [field]: url };
            writeLocalStorage(newData);

            if (s.profileId) {
              const apiField = field === 'avatarImage' ? 'avatarUrl' : 'faviconUrl';
              profileApi.updateProfile(s.profileId, { [apiField]: url }).catch(console.error);
            }

            return { siteData: newData };
          });
        })
        .catch((err) => {
          console.error('Upload failed, using base64 fallback:', err);
          base64Fallback(file, field, set);
        });
    } else {
      base64Fallback(file, field, set);
    }
  },

  // ── UI Actions ───────────────────────────────────────────────

  setStage: (stage) => set({ stage }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setPreviewDevice: (previewDevice) => set({ previewDevice }),
  setIsPublished: (isPublished) => set({ isPublished }),
  setIsOffline: (isOffline) => set({ isOffline }),
  setIsAIProcessing: (isAIProcessing) => set({ isAIProcessing }),
  setDraggedItemIndex: (draggedItemIndex) => set({ draggedItemIndex }),

  // ── Persistence ──────────────────────────────────────────────

  saveToStorage: () => writeLocalStorage(get().siteData),

  clonePage: () => {
    localStorage.setItem('tap_cloned_page', JSON.stringify(get().siteData));
  },

  publishToggle: async () => {
    const { profileId } = get();
    if (!profileId) throw new Error('No profile to publish');
    const { profile } = await profileApi.publishProfile(profileId);
    set({ isPublished: profile.isPublished ?? false });
  },
}));

function base64Fallback(file: File, field: string, set: Function) {
  const reader = new FileReader();
  reader.onloadend = () => {
    set((state: BuilderState) => {
      const newData = { ...state.siteData, [field]: reader.result as string };
      writeLocalStorage(newData);
      return { siteData: newData };
    });
  };
  reader.readAsDataURL(file);
}
