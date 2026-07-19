import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { uploadUserPhoto } from '../api/auth';
import { getMyBookings, getIncomingBookings } from '../api/bookings';
import { getMyProviderProfile } from '../api/providers';
import { getMyIdentity } from '../api/identity';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const ACTIVE_STATUSES = ['pending', 'accepted'];

const IDENTITY_STATUS = {
  unverified: { label: 'Not submitted', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  not_submitted: { label: 'Not submitted', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  pending: { label: 'Under review', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  verified: { label: 'Verified', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
};

function StatTile({ value, label, accent = 'text-slate-900 dark:text-white' }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 text-center">
      <div className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

const ROLE_LABELS = {
  customer: { label: 'Customer', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  provider: { label: 'Service Provider', cls: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' },
  admin: { label: 'Administrator', cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
};

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
];

function AvatarInitials({ name }) {
  const colorClass = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl shrink-0 ${colorClass}`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0 w-28">{label}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-100 text-right">
        {value || <span className="text-slate-400 dark:text-slate-500 italic">Not set</span>}
      </span>
    </div>
  );
}

export default function Profile() {
  const { user, fetchUser } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [activity, setActivity] = useState(null);
  const [providerInfo, setProviderInfo] = useState(null);

  useEffect(() => {
    if (!user) return;
    const summarise = (bk) => ({
      total: bk.length,
      completed: bk.filter((b) => b.status === 'completed').length,
      active: bk.filter((b) => ACTIVE_STATUSES.includes(b.status)).length,
    });

    if (user.role === 'customer') {
      getMyBookings().then((bk) => setActivity(summarise(bk))).catch(() => {});
    } else if (user.role === 'provider') {
      Promise.all([
        getMyProviderProfile().catch(() => null),
        getMyIdentity().catch(() => null),
        getIncomingBookings().catch(() => []),
      ]).then(([profile, identity, bk]) => {
        setProviderInfo({ profile, identity });
        setActivity(summarise(bk));
      });
    }
  }, [user]);

  if (!user) return null;

  const role = ROLE_LABELS[user.role] || ROLE_LABELS.customer;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      addToast('Only JPEG and PNG files are allowed.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast('File too large. Maximum size is 2 MB.', 'error');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      setUploading(true);
      await uploadUserPhoto(fd);
      await fetchUser();
      addToast('Profile photo updated.', 'success');
    } catch {
      addToast('Failed to upload photo. Please try again.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Layout title="Profile" width="form">
        {/* Header card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-5">
            {/* Avatar with upload overlay */}
            <div className="relative shrink-0 group">
              {user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <AvatarInitials name={user.name} />
              )}

              {/* Camera button overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${role.cls}`}>
                  {role.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click the camera icon to change your photo</p>
            </div>
          </div>
        </div>

        {/* Provider verification & trust */}
        {user.role === 'provider' && providerInfo && (
          <div className="card p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Verification &amp; Trust</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">Provider approval</span>
                {providerInfo.profile?.is_approved ? (
                  <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Verified Provider</span>
                ) : providerInfo.profile ? (
                  <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Pending approval</span>
                ) : (
                  <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Not applied</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">Identity</span>
                {(() => {
                  const s = IDENTITY_STATUS[providerInfo.identity?.verification_status] || IDENTITY_STATUS.unverified;
                  return <span className={`badge ${s.cls}`}>{s.label}</span>;
                })()}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Trust score</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                    {providerInfo.profile?.trust_score ?? 0}/100
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${providerInfo.profile?.trust_score ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">Rating</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  {providerInfo.profile?.review_count > 0
                    ? `${Number(providerInfo.profile.average_rating).toFixed(1)} ★ (${providerInfo.profile.review_count})`
                    : 'No reviews yet'}
                </span>
              </div>
            </div>
            {providerInfo.profile && !providerInfo.profile.is_approved && (
              <Link to="/dashboard/provider" className="btn-secondary w-full mt-5">Complete verification</Link>
            )}
          </div>
        )}

        {/* Activity summary */}
        {activity && (
          <div className="card p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              {user.role === 'provider' ? 'Job Activity' : 'Booking Activity'}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <StatTile value={activity.total} label={user.role === 'provider' ? 'Total Jobs' : 'Total Bookings'} />
              <StatTile value={activity.active} label="Active" accent="text-amber-600 dark:text-amber-400" />
              <StatTile value={activity.completed} label="Completed" accent="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        )}

        {/* Account info */}
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Account Information</h2>
          <InfoRow label="Full Name" value={user.name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone} />
          <InfoRow label="City" value={user.city} />
          <InfoRow
            label="Member Since"
            value={
              user.created_at
                ? new Date(user.created_at).toLocaleDateString('en-NP', { year: 'numeric', month: 'long' })
                : null
            }
          />
        </div>

        {/* Role-specific quick actions */}
        {user.role === 'customer' && (
          <div className="card p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Quick Links</h2>
            <div className="flex flex-col gap-2">
              <Link
                to="/dashboard/customer"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800/60 dark:hover:bg-brand-500/15 dark:hover:text-brand-200 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                My Bookings
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
              <Link
                to="/browse"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800/60 dark:hover:bg-brand-500/15 dark:hover:text-brand-200 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Browse Providers
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {user.role === 'provider' && (
          <div className="card p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Quick Links</h2>
            <div className="flex flex-col gap-2">
              <Link
                to="/dashboard/provider"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800/60 dark:hover:bg-brand-500/15 dark:hover:text-brand-200 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                My Dashboard &amp; Jobs
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="card p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Admin Quick Links</h2>
            <div className="flex flex-col gap-2">
              <Link
                to="/admin"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-colors text-sm font-medium"
              >
                Admin Panel
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          </div>
        )}
    </Layout>
  );
}
