import { apiFetch } from './api';
import type { ApiContact, AudienceOverview } from '@tap/shared';

export async function fetchContacts(profileId: string, opts?: { page?: number; search?: string }) {
  const params = new URLSearchParams();
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.search) params.set('search', opts.search);
  const qs = params.toString();
  return apiFetch<{
    contacts: ApiContact[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/profiles/${profileId}/contacts${qs ? `?${qs}` : ''}`);
}

export async function fetchAudienceOverview(profileId: string) {
  return apiFetch<AudienceOverview>(`/profiles/${profileId}/contacts/overview`);
}

export async function createContact(profileId: string, data: { email: string; name?: string }) {
  return apiFetch<{ contact: ApiContact }>(`/profiles/${profileId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContact(contactId: string, data: { name?: string | null; subscribed?: boolean }) {
  return apiFetch<{ contact: ApiContact }>(`/contacts/${contactId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteContact(contactId: string) {
  return apiFetch<{ success: boolean }>(`/contacts/${contactId}`, {
    method: 'DELETE',
  });
}

export function getExportUrl(profileId: string): string {
  return `/api/profiles/${profileId}/contacts/export`;
}
