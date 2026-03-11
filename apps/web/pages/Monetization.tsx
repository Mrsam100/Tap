import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  DollarSign, ShoppingBag, Plus, ShieldCheck,
  Sparkles, Package, Heart, Loader2,
  ChevronDown, ArrowUpRight, ArrowDownRight, Check, X,
} from 'lucide-react';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuthStore } from '../src/stores/authStore';
import { toast } from '../src/stores/toastStore';
import { fetchProfiles } from '../src/lib/profileApi';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchRevenueOverview,
  fetchOrders,
  fetchTips,
} from '../src/lib/monetizationApi';
import type {
  ApiProfile,
  ApiProduct,
  ApiOrder,
  ApiTip,
  RevenueOverview,
  AnalyticsPeriod,
} from '@tap/shared';

// ── Helpers ───────────────────────────────────────────────────────

function fmtCents(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
  { value: 'all', label: 'All time' },
];

// ── Stat card ─────────────────────────────────────────────────────

function StatCard({ label, value, change, icon: Icon, color }: {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-slate-50 ${color}`}>
          <Icon size={18} />
        </div>
        {change !== undefined && change !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-bold ${change > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-slate-400 mt-1 font-medium">{label}</div>
    </motion.div>
  );
}

// ── New product modal ─────────────────────────────────────────────

function NewProductModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; priceCents: number; type: 'digital' | 'service' }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<'digital' | 'service'>('digital');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    const cents = Math.round(parseFloat(price) * 100);
    if (isNaN(cents) || cents < 50) return setError('Minimum price is $0.50');

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), priceCents: cents, type });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-ink">New Product</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-ink"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ink focus:ring-1 focus:ring-ink outline-none text-sm"
              placeholder="e.g. Creator Masterclass"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ink focus:ring-1 focus:ring-ink outline-none text-sm resize-none"
              placeholder="What are they getting?"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Price (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ink focus:ring-1 focus:ring-ink outline-none text-sm"
                placeholder="29.00"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'digital' | 'service')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-ink focus:ring-1 focus:ring-ink outline-none text-sm bg-white"
              >
                <option value="digital">Digital Download</option>
                <option value="service">Service</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Product'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

const Monetization: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [profiles, setProfiles] = useState<ApiProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const [revenue, setRevenue] = useState<RevenueOverview | null>(null);
  const [productList, setProductList] = useState<ApiProduct[]>([]);
  const [orderList, setOrderList] = useState<ApiOrder[]>([]);
  const [tipList, setTipList] = useState<ApiTip[]>([]);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'tips'>('products');
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load profiles
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchProfiles().then((data) => {
      setProfiles(data.profiles);
      if (data.profiles.length > 0 && !activeProfileId) {
        setActiveProfileId(data.profiles[0].id);
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  // Load monetization data
  useEffect(() => {
    if (!activeProfileId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    Promise.all([
      fetchRevenueOverview(activeProfileId, period),
      fetchProducts(activeProfileId),
      fetchOrders(activeProfileId),
      fetchTips(activeProfileId),
    ]).then(([rev, prod, ord, tip]) => {
      setRevenue(rev.overview);
      setProductList(prod.products);
      setOrderList(ord.orders);
      setTipList(tip.tips);
      setError(null);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }).finally(() => setLoading(false));
  }, [activeProfileId, period, retryKey]);

  const handleCreateProduct = useCallback(async (data: {
    name: string; description: string; priceCents: number; type: 'digital' | 'service';
  }) => {
    if (!activeProfileId) return;
    const res = await createProduct(activeProfileId, data);
    setProductList((prev) => [res.product, ...prev]);
    toast.success('Product created');
  }, [activeProfileId]);

  const handleToggleProduct = useCallback(async (product: ApiProduct) => {
    await updateProduct(product.id, { isActive: !product.isActive });
    setProductList((prev) => prev.map((p) =>
      p.id === product.id ? { ...p, isActive: !p.isActive } : p
    ));
    toast.success(product.isActive ? 'Product deactivated' : 'Product activated');
  }, []);

  const handleDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductList((prev) => prev.filter((p) => p.id !== productToDelete.id));
      toast.success(`"${productToDelete.name}" deleted`);
      setProductToDelete(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete product');
      setProductToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  }, [productToDelete]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 sm:pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif text-ink mb-2">Monetization Hub</h1>
            <p className="text-slate-500">Manage your products, tips, and revenue.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {profiles.length > 1 && (
              <div className="relative">
                <select
                  value={activeProfileId || ''}
                  onChange={(e) => setActiveProfileId(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium cursor-pointer"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName || p.username}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium cursor-pointer"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <Button size="lg" onClick={() => setShowNewProduct(true)}>
              <Plus size={18} /> New Product
            </Button>
          </div>
        </div>

        {/* No profile */}
        {!loading && profiles.length === 0 && (
          <div className="text-center py-24">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">Create a profile first to start selling.</p>
            <Button onClick={() => navigate('/build')}>Create Profile</Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-24">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => { setError(null); setRetryKey((k) => k + 1); }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dashboard */}
        {!loading && !error && revenue && (
          <>
            {/* Revenue Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Revenue" value={fmtCents(revenue.totalRevenue)} change={revenue.revenueChange} icon={DollarSign} color="text-green-600" />
              <StatCard label="Product Sales" value={fmtCents(revenue.productRevenue)} icon={ShoppingBag} color="text-blue-600" />
              <StatCard label="Tips Received" value={fmtCents(revenue.tipRevenue)} icon={Heart} color="text-pink-600" />
              <StatCard label="Orders" value={fmtNum(revenue.orderCount)} icon={Package} color="text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1" role="tablist" aria-label="Monetization tabs">
                  {(['products', 'orders', 'tips'] as const).map((tab) => (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={activeTab === tab}
                      aria-controls={`tabpanel-${tab}`}
                      id={`tab-${tab}`}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors capitalize min-h-[40px] ${
                        activeTab === tab ? 'bg-ink text-white' : 'text-slate-500 hover:text-ink'
                      }`}
                    >
                      {tab} ({tab === 'products' ? productList.length : tab === 'orders' ? orderList.length : tipList.length})
                    </button>
                  ))}
                </div>

                {/* Products Tab */}
                {activeTab === 'products' && (
                  <div id="tabpanel-products" role="tabpanel" aria-labelledby="tab-products" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    {productList.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 mb-4">No products yet. Create your first one!</p>
                        <Button onClick={() => setShowNewProduct(true)}>
                          <Plus size={16} /> Create Product
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {productList.map((product) => (
                          <div
                            key={product.id}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                              product.isActive ? 'border-slate-100 hover:border-slate-200' : 'border-slate-100 bg-slate-50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt="" className="w-full h-full rounded-lg object-cover" />
                                ) : (
                                  <ShoppingBag size={20} />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold">{product.name}</h4>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                  {product.type} &middot; {product.isActive ? 'Active' : 'Inactive'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-bold">{fmtCents(product.priceCents, product.currency)}</div>
                              </div>
                              <button
                                onClick={() => handleToggleProduct(product)}
                                className={`p-2 rounded-lg transition-colors ${
                                  product.isActive ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                                }`}
                                title={product.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {product.isActive ? <Check size={14} /> : <X size={14} />}
                              </button>
                              <button
                                onClick={() => setProductToDelete(product)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                title="Delete"
                                aria-label={`Delete ${product.name}`}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div id="tabpanel-orders" role="tabpanel" aria-labelledby="tab-orders" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    {orderList.length === 0 ? (
                      <div className="text-center py-12">
                        <Package size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500">No orders yet. They will show up once customers start buying.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orderList.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                            <div>
                              <h4 className="text-sm font-bold">{order.productName || 'Product'}</h4>
                              <p className="text-xs text-slate-400">
                                {order.buyerEmail} &middot; {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-bold">{fmtCents(order.amountCents)}</div>
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                order.status === 'completed' ? 'bg-green-50 text-green-600'
                                  : order.status === 'pending' ? 'bg-amber-50 text-amber-600'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tips Tab */}
                {activeTab === 'tips' && (
                  <div id="tabpanel-tips" role="tabpanel" aria-labelledby="tab-tips" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    {tipList.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500">No tips yet. Share your profile to start receiving support!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tipList.map((tip) => (
                          <div key={tip.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                            <div>
                              <h4 className="text-sm font-bold">{tip.tipperName || 'Anonymous'}</h4>
                              {tip.tipperMessage && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">&quot;{tip.tipperMessage}&quot;</p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {tip.createdAt ? new Date(tip.createdAt).toLocaleDateString() : ''}
                              </p>
                            </div>
                            <div className="text-sm font-bold text-green-600">{fmtCents(tip.amountCents)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-ink text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={80} />
                  </div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Revenue</h3>
                  <p className="text-3xl sm:text-4xl font-bold mb-2">{fmtCents(revenue.totalRevenue)}</p>
                  {revenue.revenueChange !== 0 && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${revenue.revenueChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {revenue.revenueChange > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(revenue.revenueChange)}% vs previous period
                    </div>
                  )}
                  <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <ShieldCheck size={12} className="text-green-400" /> Secure payments via Stripe
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-ink">Quick Summary</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Active Products</span>
                    <span className="font-bold">{productList.filter((p) => p.isActive).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Orders</span>
                    <span className="font-bold">{revenue.orderCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Tips</span>
                    <span className="font-bold">{revenue.tipCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Avg Order Value</span>
                    <span className="font-bold">
                      {revenue.orderCount > 0 ? fmtCents(Math.round(revenue.productRevenue / revenue.orderCount)) : '$0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showNewProduct && (
        <NewProductModal
          onClose={() => setShowNewProduct(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      <ConfirmDialog
        open={!!productToDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Product"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};

export default Monetization;
