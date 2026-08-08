import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { getAdminProviders, approveOrRejectProvider, getAdminUsers, updateUserStatus, getAuditLog } from '../api/admin';
import { getDisputes, resolveDispute } from '../api/disputes';
import { ConfirmDialog } from '../components/Dialog';
import { getCategories, createCategory, updateCategory } from '../api/categories';
import { reviewIdentity } from '../api/identity';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Layout from '../components/Layout';
import { identityStatus, vouchStatus } from '../utils/appearance';
import { InlineError } from '../components/ErrorMessage';
import AdminAnalytics from '../components/AdminAnalytics';
import { formatDate } from '../utils/helpers';

function CategoryModal({ category, onClose, onSaved }) {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: category
      ? { name: category.name, slug: category.slug, description: category.description || '' }
      : {},
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      category ? await updateCategory(category.id, data) : await createCategory(data);
      addToast(`Category ${category ? 'updated' : 'created'}.`, 'success');
      onSaved();
      onClose();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not save category.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{category ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="cat-name" className="label">Name <span className="text-red-500">*</span></label>
            <input id="cat-name" type="text" className="input-field" placeholder="Plumbing"
              {...register('name', { required: 'Name is required' })} />
            <InlineError message={errors.name?.message} />
          </div>
          <div>
            <label htmlFor="cat-slug" className="label">Slug <span className="text-red-500">*</span></label>
            <input id="cat-slug" type="text" className="input-field" placeholder="plumbing"
              {...register('slug', { required: 'Slug is required' })} />
            <InlineError message={errors.slug?.message} />
          </div>
          <div>
            <label htmlFor="cat-desc" className="label">Description</label>
            <textarea id="cat-desc" rows={2} className="input-field h-auto py-2.5 resize-none" {...register('description')} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : category ? 'Save changes' : 'Create category'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Provider Detail Drawer ───────────────────────────────────────────────────

function ProviderDrawer({ provider, onClose, onApprove }) {
  const { addToast } = useToast();
  const [reviewingIdentity, setReviewingIdentity] = useState(false);

  const handleApproveIdentity = async (approved) => {
    setReviewingIdentity(true);
    try {
      await reviewIdentity(provider.user_id, {
        verification_status: approved ? 'verified' : 'rejected',
        nid_verified: approved && provider.identity_type === 'nid',
        pan_verified: approved && provider.identity_type === 'pan',
        citizenship_verified: approved && provider.identity_type === 'citizenship',
      });
      addToast(`Identity ${approved ? 'verified' : 'rejected'}.`, 'success');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not review identity.', 'error');
    } finally {
      setReviewingIdentity(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{provider.user_name}</h2>
            <p className="text-xs text-slate-500">{provider.user_email} · {provider.user_phone}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile info */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Profile</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400">City:</span> <span className="font-medium">{provider.city}</span></div>
              <div><span className="text-slate-400">Area:</span> <span className="font-medium">{provider.area}</span></div>
              <div><span className="text-slate-400">Rate:</span> <span className="font-medium">Rs. {provider.hourly_rate?.toLocaleString()}/hr</span></div>
              <div><span className="text-slate-400">Trust Score:</span> <span className="font-medium">{provider.trust_score}/100</span></div>
            </div>
            {provider.bio && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{provider.bio}</p>}
            {provider.services?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {provider.services.map((s) => <span key={s} className="badge bg-brand-50 text-brand-700">{s}</span>)}
              </div>
            )}
          </div>

          {/* Identity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identity Verification</p>
              <span className={`badge ${identityStatus(provider.identity_status).badgeClass}`}>
                {identityStatus(provider.identity_status).label}
              </span>
            </div>

            {provider.identity_status === 'not_submitted' ? (
              <p className="text-sm text-slate-400 italic">No identity documents submitted yet.</p>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-3">Type: <span className="font-medium uppercase">{provider.identity_type}</span></p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'NID Front', url: provider.identity_nid_front },
                    { label: 'NID Back', url: provider.identity_nid_back },
                    { label: 'PAN', url: provider.identity_pan },
                    { label: 'Citizenship', url: provider.identity_citizenship },
                  ].filter((d) => d.url).map((doc) => (
                    <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer"
                      className="block h-24 rounded-xl border-2 border-slate-200 overflow-hidden hover:border-brand-400 transition-colors">
                      <img src={doc.url} alt={doc.label} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
                {provider.identity_status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveIdentity(true)}
                      disabled={reviewingIdentity}
                      className="flex-1 h-9 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      Verify Identity
                    </button>
                    <button
                      onClick={() => handleApproveIdentity(false)}
                      disabled={reviewingIdentity}
                      className="flex-1 h-9 rounded-lg text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-200"
                    >
                      Reject Identity
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Witnesses */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Witnesses ({provider.witnesses_summary?.filter((w) => w.vouch_status === 'vouched').length || 0} confirmed)
            </p>
            {provider.witnesses_summary?.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No witnesses invited yet.</p>
            ) : (
              <div className="space-y-2">
                {provider.witnesses_summary?.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{w.name}</p>
                      <p className="text-xs text-slate-500">{w.phone}{w.relationship ? ` · ${w.relationship}` : ''}{w.years_known ? ` · ${w.years_known}y` : ''}</p>
                      {w.has_account && <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded mt-1 inline-block">Has account</span>}
                    </div>
                    <span className={`text-xs font-semibold ${vouchStatus(w.vouch_status).textClass}`}>
                      {vouchStatus(w.vouch_status).label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approve/Reject */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex gap-3">
              {!provider.is_approved ? (
                <button
                  onClick={() => onApprove(provider.id, true)}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  Approve Provider
                </button>
              ) : (
                <button
                  onClick={() => onApprove(provider.id, false)}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-200"
                >
                  Revoke Approval
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

const USER_STATUS = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  deactivated: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

function Pager({ page, total, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="btn-secondary btn-sm">
        Previous
      </button>
      <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">Page {page} of {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} className="btn-secondary btn-sm">
        Next
      </button>
    </div>
  );
}

function UsersTab() {
  const { addToast } = useToast();
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);
  const debounceRef = useRef(null);

  // Debounced so typing doesn't fire a request per keystroke.
  useEffect(() => {
    debounceRef.current = setTimeout(() => { setSearch(query); setPage(1); }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      setData(await getAdminUsers({
        q: search || undefined,
        role: role || undefined,
        status: status || undefined,
        page,
      }));
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, role, status, page]);

  const handleStatusChange = async () => {
    setActing(true);
    const next = target.status === 'suspended' ? 'active' : 'suspended';
    try {
      const updated = await updateUserStatus(target.id, next, reason.trim() || undefined);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((u) => (u.id === updated.id ? updated : u)),
      }));
      addToast(next === 'active' ? 'User reactivated.' : 'User suspended.', 'success');
      setTarget(null);
      setReason('');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not update this user.', 'error');
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-4">
        <label htmlFor="user-search" className="sr-only">Search users</label>
        <input
          id="user-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email"
          className="input-field sm:w-64"
        />
        <label htmlFor="user-role" className="sr-only">Filter by role</label>
        <select id="user-role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="input-field sm:w-44">
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
        </select>
        <label htmlFor="user-status" className="sr-only">Filter by status</label>
        <select id="user-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field sm:w-44">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={fetchUsers} /> :
        data.items.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No users match these filters.</div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Users">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left">
                      {['User', 'Role', 'City', 'Status', 'Joined', 'Actions'].map((h) => (
                        <th key={h} scope="col" className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.items.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="block font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                          <span className="block text-xs text-slate-400">{u.email}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 capitalize whitespace-nowrap">{u.role}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{u.city || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${USER_STATUS[u.status] || USER_STATUS.deactivated}`}>{u.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          {u.role === 'admin' ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <button
                              onClick={() => { setTarget(u); setReason(''); }}
                              className={`text-xs h-8 px-3 rounded-lg font-semibold transition-colors ${
                                u.status === 'suspended'
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300'
                              }`}
                            >
                              {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pager page={data.page} total={data.total} pageSize={data.page_size} onChange={setPage} />
          </>
        )}

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={handleStatusChange}
        loading={acting}
        tone={target?.status === 'suspended' ? 'primary' : 'danger'}
        title={target?.status === 'suspended' ? `Reactivate ${target?.name}?` : `Suspend ${target?.name}?`}
        description={
          target?.status === 'suspended'
            ? 'They will be able to sign in again immediately.'
            : 'They will be signed out and blocked from signing in. Their bookings and reviews stay visible.'
        }
        confirmLabel={target?.status === 'suspended' ? 'Reactivate' : 'Suspend'}
      >
        <label htmlFor="status-reason" className="label">
          Reason <span className="text-text-subtle font-normal">(optional)</span>
        </label>
        <textarea
          id="status-reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input-field h-auto py-2.5 resize-none"
          placeholder="e.g. repeated no-shows"
        />
        <span className="hint">Recorded in the audit log. Not shown to the user.</span>
      </ConfirmDialog>
    </>
  );
}

// ─── Audit log ────────────────────────────────────────────────────────────────

function AuditTab() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true); setError(null);
    try {
      setData(await getAuditLog({ action: action || undefined, page }));
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not load the audit log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [action, page]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <label htmlFor="audit-action" className="sr-only">Filter by action</label>
        <select id="audit-action" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="input-field sm:w-56">
          <option value="">All actions</option>
          {['provider_approved', 'provider_rejected', 'identity_verified', 'identity_rejected',
            'user_suspended', 'user_reactivated', 'review_deleted', 'dispute_resolved'].map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={fetchLogs} /> :
        data.items.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No moderation actions recorded yet.</div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Admin audit log">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left">
                      {['When', 'Admin', 'Action', 'Target', 'Reason'].map((h) => (
                        <th key={h} scope="col" className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.items.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(row.created_at)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">{row.admin_name || `#${row.admin_id}`}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {row.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {row.target_type.replace(/_/g, ' ')} #{row.target_id}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pager page={data.page} total={data.total} pageSize={data.page_size} onChange={setPage} />
          </>
        )}
    </>
  );
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

const DISPUTE_STATUS = {
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  under_review: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  dismissed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

function DisputesTab() {
  const { addToast } = useToast();
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [nextStatus, setNextStatus] = useState('resolved');
  const [resolution, setResolution] = useState('');
  const [acting, setActing] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true); setError(null);
    try {
      setData(await getDisputes({ status: status || undefined, page }));
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not load disputes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, [status, page]);

  const handleResolve = async () => {
    setActing(true);
    try {
      const updated = await resolveDispute(target.id, {
        status: nextStatus,
        resolution: resolution.trim() || undefined,
      });
      setData((prev) => ({
        ...prev,
        items: prev.items.map((d) => (d.id === updated.id ? updated : d)),
      }));
      addToast('Dispute updated.', 'success');
      setTarget(null);
      setResolution('');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not update this dispute.', 'error');
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <label htmlFor="dispute-status" className="sr-only">Filter by status</label>
        <select id="dispute-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field sm:w-48">
          <option value="">All statuses</option>
          {['open', 'under_review', 'resolved', 'dismissed'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={fetchDisputes} /> :
        data.items.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No disputes to review.</div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Booking disputes">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left">
                      {['Filed', 'Booking', 'Reporter', 'Reason', 'Details', 'Status', 'Actions'].map((h) => (
                        <th key={h} scope="col" className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.items.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(d.created_at)}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular whitespace-nowrap">#{d.booking_id}</td>
                        <td className="px-4 py-3">
                          <span className="block font-medium text-slate-800 dark:text-slate-100">{d.reporter_name || `#${d.reported_by}`}</span>
                          <span className="block text-xs text-slate-400 capitalize">{d.reporter_role}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 capitalize whitespace-nowrap">{d.reason.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs">
                          <span className="line-clamp-2">{d.description}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${DISPUTE_STATUS[d.status] || DISPUTE_STATUS.dismissed}`}>
                            {d.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {['resolved', 'dismissed'].includes(d.status) ? (
                            <span className="text-xs text-slate-400">Closed</span>
                          ) : (
                            <button
                              onClick={() => { setTarget(d); setNextStatus('resolved'); setResolution(''); }}
                              className="text-xs h-8 px-3 rounded-lg font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 transition-colors whitespace-nowrap"
                            >
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pager page={data.page} total={data.total} pageSize={data.page_size} onChange={setPage} />
          </>
        )}

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={handleResolve}
        loading={acting}
        tone="primary"
        title={`Dispute on booking #${target?.booking_id}`}
        description={target?.description}
        confirmLabel="Save"
      >
        <label htmlFor="dispute-outcome" className="label">Outcome</label>
        <select
          id="dispute-outcome"
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value)}
          className="input-field mb-3"
        >
          <option value="under_review">Mark under review</option>
          <option value="resolved">Resolve</option>
          <option value="dismissed">Dismiss</option>
        </select>

        <label htmlFor="dispute-resolution" className="label">
          Resolution note <span className="text-text-subtle font-normal">(optional)</span>
        </label>
        <textarea
          id="dispute-resolution"
          rows={2}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          className="input-field h-auto py-2.5 resize-none"
          placeholder="What was decided and why"
        />
        <span className="hint">Sent to both parties when you resolve or dismiss.</span>
      </ConfirmDialog>
    </>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { addToast } = useToast();
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingC, setLoadingC] = useState(true);
  const [errorP, setErrorP] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const [categoryModal, setCategoryModal] = useState(null);
  const [drawerProvider, setDrawerProvider] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchProviders = async () => {
    setLoadingP(true); setErrorP(null);
    try { setProviders(await getAdminProviders()); }
    catch { setErrorP('Could not load providers.'); }
    finally { setLoadingP(false); }
  };

  const fetchCategories = async () => {
    setLoadingC(true);
    try { setCategories(await getCategories()); }
    catch { addToast('Could not load categories.', 'error'); }
    finally { setLoadingC(false); }
  };

  useEffect(() => { fetchProviders(); fetchCategories(); }, []);

  const applyApproval = async (id, isApproved, reason) => {
    try {
      const updated = await approveOrRejectProvider(id, isApproved, reason);
      setProviders((prev) => prev.map((p) => p.id === id ? { ...p, is_approved: updated.is_approved, application_status: updated.application_status, rejection_reason: updated.rejection_reason } : p));
      addToast(`Provider ${isApproved ? 'approved' : 'revoked'}.`, 'success');
      if (drawerProvider?.id === id) setDrawerProvider((prev) => ({ ...prev, is_approved: isApproved }));
    } catch {
      addToast('Could not update provider.', 'error');
    }
  };

  // Rejection reaches the provider in their notification, so it is captured rather than assumed.
  const handleApproval = (id, isApproved) => {
    if (isApproved) return applyApproval(id, true);
    setRejectTarget(providers.find((p) => p.id === id) || { id });
    setRejectReason('');
  };

  const handleReject = async () => {
    setRejecting(true);
    await applyApproval(rejectTarget.id, false, rejectReason.trim() || undefined);
    setRejecting(false);
    setRejectTarget(null);
  };

  const pending = providers.filter((p) => !p.is_approved);
  const approved = providers.filter((p) => p.is_approved);
  const displayed = filter === 'pending' ? pending : filter === 'approved' ? approved : providers;

  return (
    <Layout title="Admin">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review provider applications, verify identities, and manage categories.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending', count: pending.length, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
            { label: 'Approved', count: approved.length, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
            { label: 'All Providers', count: providers.length, cls: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' },
            { label: 'Categories', count: categories.length, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              className={`rounded-xl p-4 text-left hover:opacity-90 transition-opacity ${s.cls}`}
              onClick={() => {
                if (s.label === 'Categories') { setActiveTab('categories'); return; }
                setActiveTab('providers');
                setFilter(s.label === 'All Providers' ? 'all' : s.label.toLowerCase());
              }}
            >
              <div className="text-2xl font-bold tabular-nums">{s.count}</div>
              <div className="text-xs mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-bg-subtle rounded-xl mb-6 overflow-x-auto scrollbar-none">
          {['analytics', 'providers', 'categories', 'users', 'disputes', 'audit'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Analytics */}
        {activeTab === 'analytics' && <AdminAnalytics />}

        {activeTab === 'users' && <UsersTab />}

        {activeTab === 'disputes' && <DisputesTab />}

        {activeTab === 'audit' && <AuditTab />}

        {/* Providers table */}
        {activeTab === 'providers' && (
          <>
            {/* Filter pills */}
            <div className="flex gap-2 mb-4">
              {['all', 'pending', 'approved'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all
                    ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                  {f}
                </button>
              ))}
            </div>

            {loadingP ? <LoadingSpinner /> : errorP ? <ErrorMessage message={errorP} onRetry={fetchProviders} /> :
              displayed.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">No provider applications in this filter.</div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" aria-label="Provider applications">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left">
                          {['Provider', 'Location', 'Services', 'Rate/hr', 'Identity', 'Witnesses', 'Status', 'Actions'].map((h) => (
                            <th key={h} scope="col" className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {displayed.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setDrawerProvider(p)}
                                className="text-left rounded-sm"
                                aria-label={`Open full record for ${p.user_name}`}
                              >
                                <span className="block font-medium text-slate-800 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                                  {p.user_name}
                                </span>
                                <span className="block text-xs text-slate-400">{p.user_email}</span>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{p.city}{p.area ? `, ${p.area}` : ''}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {p.services?.slice(0, 2).map((s) => <span key={s} className="badge bg-brand-50 text-brand-700">{s}</span>)}
                                {p.services?.length > 2 && <span className="badge bg-slate-100 text-slate-500">+{p.services.length - 2}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                              {p.hourly_rate ? `Rs. ${p.hourly_rate.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${identityStatus(p.identity_status).badgeClass}`}>
                                {identityStatus(p.identity_status).label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-semibold tabular-nums ${p.witnesses_confirmed >= 3 ? 'text-emerald-700' : 'text-amber-600'}`}>
                                {p.witnesses_confirmed}/3
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${p.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {p.is_approved ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {!p.is_approved ? (
                                <button onClick={() => handleApproval(p.id, true)}
                                  className="text-xs h-8 px-3 rounded-lg font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap">
                                  Approve
                                </button>
                              ) : (
                                <button onClick={() => handleApproval(p.id, false)}
                                  className="text-xs h-8 px-3 rounded-lg font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors whitespace-nowrap">
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            }
          </>
        )}

        {/* Categories table */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setCategoryModal('new')} className="btn-primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Category
              </button>
            </div>
            {loadingC ? <LoadingSpinner /> : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Service categories">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left">
                        {['Name', 'Slug', 'Description', 'Status', 'Actions'].map((h) => (
                          <th key={h} scope="col" className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{cat.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{cat.slug}</td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{cat.description || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${cat.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setCategoryModal(cat)} className="btn-ghost text-xs h-8 px-3">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      {categoryModal && (
        <CategoryModal
          category={categoryModal === 'new' ? null : categoryModal}
          onClose={() => setCategoryModal(null)}
          onSaved={fetchCategories}
        />
      )}

      {drawerProvider && (
        <ProviderDrawer
          provider={drawerProvider}
          onClose={() => setDrawerProvider(null)}
          onApprove={handleApproval}
        />
      )}

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        loading={rejecting}
        title="Revoke this application?"
        description="The provider will be notified and will stop appearing in search results."
        confirmLabel="Revoke"
      >
        <label htmlFor="reject-reason" className="label">
          Reason <span className="text-text-subtle font-normal">(optional)</span>
        </label>
        <textarea
          id="reject-reason"
          rows={2}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="input-field h-auto py-2.5 resize-none"
          placeholder="e.g. identity documents did not match"
        />
        <span className="hint">Included in the notification sent to the provider.</span>
      </ConfirmDialog>
    </Layout>
  );
}
