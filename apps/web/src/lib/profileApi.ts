import { apiFetch } from './api';
import type { ApiProfile, ApiProfileFull, ApiLink, ApiSocial, ApiCollection, PublicProfile } from '@tap/shared';

// ── Profiles ───────────────────────────────────────────────────────

export async function fetchProfiles() {
  return apiFetch<{ profiles: ApiProfile[] }>('/profiles');
}

export async function fetchProfile(profileId: string) {
  return apiFetch<{ profile: ApiProfileFull }>(`/profiles/${profileId}`);
}

export async function createProfile(data: {
  displayName: string;
  bio?: string;
  themeId?: string;
  fontId?: string;
}) {
  return apiFetch<{ profile: ApiProfile }>('/profiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProfile(profileId: string, data: Record<string, unknown>) {
  return apiFetch<{ profile: ApiProfile }>(`/profiles/${profileId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProfile(profileId: string) {
  return apiFetch<{ success: boolean }>(`/profiles/${profileId}`, {
    method: 'DELETE',
  });
}

export async function publishProfile(profileId: string) {
  return apiFetch<{ profile: ApiProfile }>(`/profiles/${profileId}/publish`, {
    method: 'POST',
  });
}

export async function duplicateProfile(profileId: string) {
  return apiFetch<{ profile: ApiProfile }>(`/profiles/${profileId}/duplicate`, {
    method: 'POST',
  });
}

// ── Links ──────────────────────────────────────────────────────────

export async function fetchLinks(profileId: string) {
  return apiFetch<{ links: ApiLink[] }>(`/profiles/${profileId}/links`);
}

export async function createLink(profileId: string, data: {
  type: string;
  label?: string;
  url?: string;
  style?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  return apiFetch<{ link: ApiLink }>(`/profiles/${profileId}/links`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLink(linkId: string, data: Record<string, unknown>) {
  return apiFetch<{ link: ApiLink }>(`/links/${linkId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLink(linkId: string) {
  return apiFetch<{ success: boolean }>(`/links/${linkId}`, {
    method: 'DELETE',
  });
}

export async function duplicateLink(linkId: string) {
  return apiFetch<{ link: ApiLink }>(`/links/${linkId}/duplicate`, {
    method: 'POST',
  });
}

export async function reorderLinks(profileId: string, ids: string[]) {
  return apiFetch<{ success: boolean }>(`/profiles/${profileId}/links/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
}

// ── Socials ────────────────────────────────────────────────────────

export async function fetchSocials(profileId: string) {
  return apiFetch<{ socials: ApiSocial[] }>(`/profiles/${profileId}/socials`);
}

export async function createSocial(profileId: string, data: { platform: string; url: string }) {
  return apiFetch<{ social: ApiSocial }>(`/profiles/${profileId}/socials`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSocial(socialId: string, data: { url?: string; platform?: string }) {
  return apiFetch<{ social: ApiSocial }>(`/socials/${socialId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteSocial(socialId: string) {
  return apiFetch<{ success: boolean }>(`/socials/${socialId}`, {
    method: 'DELETE',
  });
}

export async function reorderSocials(profileId: string, ids: string[]) {
  return apiFetch<{ success: boolean }>(`/profiles/${profileId}/socials/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
}

// ── Collections ────────────────────────────────────────────────────

export async function fetchCollections(profileId: string) {
  return apiFetch<{ collections: ApiCollection[] }>(`/profiles/${profileId}/collections`);
}

export async function createCollection(profileId: string, data: { title: string }) {
  return apiFetch<{ collection: ApiCollection }>(`/profiles/${profileId}/collections`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCollection(collectionId: string, data: { title?: string; isCollapsedDefault?: boolean }) {
  return apiFetch<{ collection: ApiCollection }>(`/collections/${collectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCollection(collectionId: string) {
  return apiFetch<{ success: boolean }>(`/collections/${collectionId}`, {
    method: 'DELETE',
  });
}

// ── Uploads ────────────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch<{ url: string; filename: string }>('/uploads/media', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadAvatar(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch<{ url: string; filename: string }>('/uploads/avatar', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteUpload(filename: string) {
  return apiFetch<{ success: boolean }>(`/uploads/${filename}`, {
    method: 'DELETE',
  });
}

// ── Public Profile ─────────────────────────────────────────────────

export async function fetchPublicProfile(username: string) {
  return apiFetch<{ profile: PublicProfile }>(`/public/${username}`);
}
