import { apiFetch } from './api';
import type {
  ApiProduct,
  ApiOrder,
  ApiTip,
  RevenueOverview,
  ApiSubscription,
  PlanInfo,
  AnalyticsPeriod,
} from '@tap/shared';

// ── Products ──────────────────────────────────────────────────────

export async function fetchProducts(profileId: string) {
  return apiFetch<{ products: ApiProduct[] }>(`/profiles/${profileId}/products`);
}

export async function createProduct(profileId: string, data: {
  name: string;
  description?: string | null;
  priceCents: number;
  currency?: string;
  type: 'digital' | 'service';
  fileUrl?: string | null;
  imageUrl?: string | null;
}) {
  return apiFetch<{ product: ApiProduct }>(`/profiles/${profileId}/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(productId: string, data: Partial<{
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  type: string;
  fileUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
}>) {
  return apiFetch<{ product: ApiProduct }>(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(productId: string) {
  return apiFetch<{ ok: boolean }>(`/products/${productId}`, {
    method: 'DELETE',
  });
}

// ── Revenue ───────────────────────────────────────────────────────

export async function fetchRevenueOverview(profileId: string, period: AnalyticsPeriod = '30d') {
  return apiFetch<{ overview: RevenueOverview }>(
    `/profiles/${profileId}/revenue/overview?period=${period}`
  );
}

// ── Orders ────────────────────────────────────────────────────────

export async function fetchOrders(profileId: string, limit = 50, offset = 0) {
  return apiFetch<{ orders: ApiOrder[] }>(
    `/profiles/${profileId}/orders?limit=${limit}&offset=${offset}`
  );
}

export async function fulfillOrder(orderId: string) {
  return apiFetch<{ ok: boolean }>(`/orders/${orderId}/fulfill`, {
    method: 'PATCH',
  });
}

// ── Tips ──────────────────────────────────────────────────────────

export async function fetchTips(profileId: string, limit = 50) {
  return apiFetch<{ tips: ApiTip[] }>(
    `/profiles/${profileId}/tips?limit=${limit}`
  );
}

// ── Billing ───────────────────────────────────────────────────────

export async function fetchPlans() {
  return apiFetch<{ plans: PlanInfo[] }>('/billing/plans');
}

export async function fetchSubscription() {
  return apiFetch<{
    subscription: ApiSubscription | null;
    currentPlan: PlanInfo;
  }>('/billing/subscription');
}

export async function createSubscription(planId: string) {
  return apiFetch<{ url: string }>('/billing/subscribe', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
}

export async function openBillingPortal() {
  return apiFetch<{ url: string }>('/billing/portal', {
    method: 'POST',
  });
}

// ── Connect ───────────────────────────────────────────────────────

export async function startConnectOnboarding() {
  return apiFetch<{ url: string }>('/connect/onboard', {
    method: 'POST',
  });
}

export async function fetchConnectStatus() {
  return apiFetch<{
    connected: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  }>('/connect/status');
}
