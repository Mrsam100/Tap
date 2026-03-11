import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users, UserPlus, Mail, Download, Search,
  Trash2, Loader2, ChevronLeft, ChevronRight, LinkIcon,
} from 'lucide-react';
import { useAuthStore } from '../src/stores/authStore';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../src/stores/toastStore';
import { fetchProfiles } from '../src/lib/profileApi';
import {
  fetchContacts,
  fetchAudienceOverview,
  createContact,
  deleteContact,
  getExportUrl,
} from '../src/lib/audienceApi';
import type { ApiContact, AudienceOverview, ApiProfile } from '@tap/shared';

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 dark:bg-amber-700/50 text-inherit rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const Audience: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [noProfile, setNoProfile] = useState(false);
  const [overview, setOverview] = useState<AudienceOverview | null>(null);
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [contactToDelete, setContactToDelete] = useState<ApiContact | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search input — 400ms delay
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search]);

  // Load profile on mount
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfiles()
      .then(({ profiles }) => {
        if (profiles.length > 0) setProfile(profiles[0]);
        else { setNoProfile(true); setLoading(false); }
      })
      .catch(() => { setNoProfile(true); setLoading(false); });
  }, [user, navigate]);

  // Load data when profile or debounced search/page changes
  const loadData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [overviewData, contactsData] = await Promise.all([
        page === 1 ? fetchAudienceOverview(profile.id) : Promise.resolve(null),
        fetchContacts(profile.id, { page, search: debouncedSearch || undefined }),
      ]);
      if (overviewData) setOverview(overviewData);
      setContacts(contactsData.contacts);
      setTotal(contactsData.total);
      setTotalPages(contactsData.totalPages);
    } catch (err) {
      console.error('Failed to load audience data:', err);
      toast.error('Failed to load audience data. Pull to refresh or try again.');
    } finally {
      setLoading(false);
    }
  }, [profile, page, debouncedSearch]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediate search on form submit (bypass debounce)
    setDebouncedSearch(search);
    setPage(1);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newEmail.trim()) return;
    setAddError('');
    try {
      await createContact(profile.id, {
        email: newEmail.trim(),
        name: newName.trim() || undefined,
      });
      setNewEmail('');
      setNewName('');
      setShowAddForm(false);
      toast.success('Contact added');
      loadData();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add contact');
    }
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    const deletingContact = contactToDelete;
    setDeleteLoading(true);

    // Optimistic removal
    setContacts(prev => prev.filter(c => c.id !== deletingContact.id));
    setTotal(prev => prev - 1);
    setContactToDelete(null);

    try {
      await deleteContact(deletingContact.id);
      toast.success('Contact deleted');
    } catch (err) {
      // Revert on failure
      setContacts(prev => [...prev, deletingContact].sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ));
      setTotal(prev => prev + 1);
      toast.error('Failed to delete contact');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => {
    if (!profile) return;
    window.open(getExportUrl(profile.id), '_blank');
  };

  if (!user) return null;

  // No profile state
  if (noProfile) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black pt-20 sm:pt-28 pb-16 sm:pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center py-20">
          <LinkIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-xl font-serif font-bold text-ink dark:text-white mb-2">No profile yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create a profile first to start building your audience.</p>
          <button
            onClick={() => navigate('/build')}
            className="px-6 py-2.5 bg-jam-red text-white rounded-full text-sm font-medium hover:bg-jam-red/90 transition-colors"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black pt-20 sm:pt-28 pb-16 sm:pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-serif font-bold text-ink dark:text-white mb-2">Audience</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your contacts and email subscribers</p>
        </motion.div>

        {/* Stats Cards */}
        {overview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-ink dark:text-white">{overview.totalContacts}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Contacts</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Mail size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-ink dark:text-white">{overview.subscribedContacts}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Subscribed</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <UserPlus size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-ink dark:text-white">{overview.contactsChange}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Last 30 Days</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4"
        >
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1 w-full sm:max-w-xs relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink dark:text-white focus:outline-none focus:border-ink dark:focus:border-slate-400"
              />
            </form>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-jam-red text-white rounded-lg text-sm font-medium hover:bg-jam-red/90 transition-colors"
              >
                <UserPlus size={14} /> Add
              </button>
              <button
                onClick={handleExport}
                disabled={!profile || total === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-colors disabled:opacity-50"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Add Contact Form */}
          {showAddForm && (
            <form onSubmit={handleAdd} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink dark:text-white focus:outline-none focus:border-ink dark:focus:border-slate-400"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (optional)"
                className="sm:w-40 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink dark:text-white focus:outline-none focus:border-ink dark:focus:border-slate-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
              >
                Add Contact
              </button>
              {addError && <p className="text-xs text-red-500 self-center">{addError}</p>}
            </form>
          )}
        </motion.div>

        {/* Contacts Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {loading ? (
            <div className="animate-pulse">
              <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-3 flex gap-4">
                {['40%', '20%', '15%', '10%', '15%'].map((w, i) => (
                  <div key={i} className="h-3 rounded bg-slate-200 dark:bg-slate-700" style={{ width: w }} />
                ))}
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-slate-50 dark:border-slate-800 px-5 py-4 flex gap-4">
                  <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" style={{ width: '35%' }} />
                  <div className="h-4 rounded bg-slate-100 dark:bg-slate-800" style={{ width: '15%' }} />
                  <div className="h-4 rounded bg-slate-100 dark:bg-slate-800" style={{ width: '12%' }} />
                  <div className="h-4 rounded bg-slate-100 dark:bg-slate-800" style={{ width: '10%' }} />
                  <div className="h-4 rounded bg-slate-100 dark:bg-slate-800" style={{ width: '12%' }} />
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-20">
              <Users size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-serif font-bold text-ink dark:text-white mb-2">
                {search ? 'No contacts found' : 'No contacts yet'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {search
                  ? 'Try a different search term'
                  : 'Add email gates to your links to start collecting contacts'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-px">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-left">
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Email</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Name</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Source</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Date</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3 text-sm text-ink dark:text-white font-medium">{highlightMatch(c.email, debouncedSearch)}</td>
                        <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{c.name ? highlightMatch(c.name, debouncedSearch) : '—'}</td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {c.source || 'manual'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.subscribed ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            {c.subscribed ? 'Subscribed' : 'Unsubscribed'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setContactToDelete(c)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            aria-label={`Delete ${c.email}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {total} contact{total !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <ConfirmDialog
        open={!!contactToDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contactToDelete?.email}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setContactToDelete(null)}
      />
    </div>
  );
};

export default Audience;
