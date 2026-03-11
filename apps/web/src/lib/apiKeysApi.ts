import { apiFetch } from './api';
import type { ApiKey } from '@tap/shared';

export async function fetchApiKeys() {
  return apiFetch<{ keys: ApiKey[] }>('/api-keys');
}

export async function createApiKey(name: string) {
  return apiFetch<{ key: string; apiKey: ApiKey }>('/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteApiKey(keyId: string) {
  return apiFetch<{ success: boolean }>(`/api-keys/${keyId}`, {
    method: 'DELETE',
  });
}
