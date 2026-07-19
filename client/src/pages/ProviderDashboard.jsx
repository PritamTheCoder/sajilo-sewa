import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { getIncomingBookings, updateBookingStatus } from '../api/bookings';
import { getMyProviderProfile, applyAsProvider, updateProviderProfile, uploadProviderPhoto } from '../api/providers';
import { getMyIdentity, submitIdentity, uploadIdentityDocument } from '../api/identity';
import { inviteWitness, getMyWitnesses } from '../api/witness';
import { getCategories } from '../api/categories';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookingCard from '../components/BookingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage, { InlineError } from '../components/ErrorMessage';
import Layout from '../components/Layout';

const STATUS_TABS = ['all', 'pending', 'accepted', 'completed', 'cancelled'];

const VOUCH_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  vouched: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
  declined: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
  expired: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

const ID_STATUS_STYLES = {
  unverified: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

// ─── Identity Section ────────────────────────────────────────────────────────

function IdentitySection({ identity, onRefresh }) {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      primary_id_type: identity?.primary_id_type || 'nid',
      nid_number: identity?.nid_number || '',
      pan_number: identity?.pan_number || '',
      citizenship_number: identity?.citizenship_number || '',
      citizenship_district: identity?.citizenship_district || '',
    },
  });

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(docType);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await uploadIdentityDocument(docType, fd);
      addToast('Document uploaded.', 'success');
      onRefresh();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Upload failed.', 'error');
    } finally {
      setUploading(null);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await submitIdentity(data);
      addToast('Identity submitted for review.', 'success');
      onRefresh();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const status = identity?.verification_status || 'unverified';
  const statusLabel = { unverified: 'Not Submitted', pending: 'Under Review', verified: 'Verified', rejected: 'Rejected' }[status];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Identity Verification</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Required for provider approval. Your documents are kept private.</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ID_STATUS_STYLES[status]}`}>
          {statusLabel}
        </span>
      </div>

      {status === 'rejected' && identity?.rejection_reason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <strong>Rejection reason:</strong> {identity.rejection_reason}
        </div>
      )}

      {status !== 'verified' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Primary ID Type <span className="text-red-500">*</span></label>
            <select className="input-field" {...register('primary_id_type', { required: true })}>
              <option value="nid">National ID Card (Rastriya Parichaya Patra)</option>
              <option value="pan">PAN Card</option>
              <option value="citizenship">Citizenship Certificate (Nagarikta)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">NID Number</label>
              <input type="text" className="input-field" placeholder="16-digit NID number" {...register('nid_number')} />
            </div>
            <div>
              <label className="label">PAN Number</label>
              <input type="text" className="input-field" placeholder="9-character PAN" {...register('pan_number')} />
            </div>
            <div>
              <label className="label">Citizenship Number</label>
              <input type="text" className="input-field" placeholder="Certificate number" {...register('citizenship_number')} />
            </div>
            <div>
              <label className="label">Citizenship District</label>
              <input type="text" className="input-field" placeholder="E.g. Kathmandu" {...register('citizenship_district')} />
            </div>
          </div>

          {/* Document uploads */}
          <div>
            <p className="label mb-2">Upload Documents (JPEG/PNG, max 2MB each)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'nid_front', label: 'NID Front', url: identity?.nid_document_front_url },
                { key: 'nid_back', label: 'NID Back', url: identity?.nid_document_back_url },
                { key: 'pan', label: 'PAN Card', url: identity?.pan_document_url },
                { key: 'citizenship', label: 'Citizenship', url: identity?.citizenship_document_url },
              ].map(({ key, label, url }) => (
                <label key={key} className="relative cursor-pointer group">
                  <div className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-xs font-medium transition-all
                    ${url ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10 dark:hover:text-brand-300'}`}>
                    {uploading === key ? (
                      <svg className="w-5 h-5 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : url ? (
                      <>
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Uploaded
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        {label}
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => handleDocUpload(e, key)}
                    disabled={!!uploading}
                  />
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting…' : 'Submit for Verification'}
          </button>
        </form>
      )}

      {status === 'verified' && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Identity Verified</p>
            <p className="text-xs text-emerald-700 mt-0.5">Your {identity.primary_id_type?.toUpperCase()} has been verified by our team.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Witness Section ─────────────────────────────────────────────────────────

function WitnessSection({ witnesses, onRefresh, profile }) {
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onInvite = async (data) => {
    setSubmitting(true);
    try {
      await inviteWitness(data);
      addToast('Witness invited! Share the link with them.', 'success');
      reset();
      setShowForm(false);
      onRefresh();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not invite witness.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const vouchedCount = witnesses.filter((w) => w.vouch_status === 'vouched').length;
  const needed = Math.max(0, 3 - vouchedCount);

  const copyLink = (token) => {
    const url = `${window.location.origin}/vouch/${token}`;
    navigator.clipboard.writeText(url).then(() => addToast('Link copied to clipboard!', 'success'));
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Witnesses (साक्षी)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">People who vouch for your trustworthiness. Minimum 3 needed.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold tabular-nums px-2.5 py-1 rounded-full ${vouchedCount >= 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {vouchedCount}/3+ confirmed
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5 mt-3">
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${vouchedCount >= 3 ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${Math.min((vouchedCount / 3) * 100, 100)}%` }}
          />
        </div>
        {needed > 0 && (
          <p className="text-xs text-slate-500 mt-1.5">{needed} more witness{needed !== 1 ? 'es' : ''} needed before you can submit for approval.</p>
        )}
      </div>

      {/* Witness list */}
      {witnesses.length > 0 && (
        <div className="space-y-2 mb-4">
          {witnesses.map((w) => (
            <div key={w.id} className={`flex items-center justify-between p-3 rounded-xl border ${VOUCH_STATUS_STYLES[w.vouch_status] || 'border-slate-200'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{w.witness_name}</p>
                <p className="text-xs text-slate-500">{w.witness_phone}{w.relationship ? ` · ${w.relationship}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-xs font-semibold capitalize">{w.vouch_status}</span>
                {w.vouch_status === 'pending' && (
                  <button
                    onClick={() => copyLink(w.invitation_token)}
                    title="Copy invitation link"
                    className="ml-1 w-7 h-7 rounded-lg bg-white/60 hover:bg-white flex items-center justify-center border border-current/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {witnesses.filter((w) => w.vouch_status !== 'declined').length < 5 && (
        <>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Invite a Witness
            </button>
          ) : (
            <form onSubmit={handleSubmit(onInvite)} className="space-y-3 border-t border-slate-100 pt-4 animate-fade-in">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Invite someone to vouch for you</p>
              <p className="text-xs text-slate-500">They don't need to have a Sajilo Sewa account. They'll get a link to register and vouch for you.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Their Name <span className="text-red-500">*</span></label>
                  <input type="text" className="input-field" placeholder="Ram Bahadur" {...register('witness_name', { required: 'Required' })} />
                  <InlineError message={errors.witness_name?.message} />
                </div>
                <div>
                  <label className="label">Their Phone <span className="text-red-500">*</span></label>
                  <input type="tel" className="input-field" placeholder="98XXXXXXXX" {...register('witness_phone', { required: 'Required' })} />
                  <InlineError message={errors.witness_phone?.message} />
                </div>
                <div>
                  <label className="label">Their Email</label>
                  <input type="email" className="input-field" placeholder="optional" {...register('witness_email')} />
                </div>
                <div>
                  <label className="label">Relationship</label>
                  <input type="text" className="input-field" placeholder="Neighbor, Employer…" {...register('relationship')} />
                </div>
                <div>
                  <label className="label">Years Known</label>
                  <input type="number" min="0" className="input-field" placeholder="3" {...register('years_known')} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Sending…' : 'Send Invitation'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

// ─── Profile Edit Section ─────────────────────────────────────────────────────

function ProfileEditSection({ profile, categories, onSaved }) {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef(null);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      bio: profile.bio || '',
      city: profile.city || '',
      area: profile.area || '',
      hourly_rate: profile.hourly_rate || '',
      services: (profile.services || []).join(', '),
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await uploadProviderPhoto(fd);
      addToast('Profile photo updated!', 'success');
      onSaved();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Photo upload failed.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const services = data.services.split(',').map((s) => s.trim()).filter(Boolean);
      await updateProviderProfile({ ...data, services, hourly_rate: parseFloat(data.hourly_rate) });
      addToast('Profile updated!', 'success');
      onSaved();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const AVATAR_COLORS = ['bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700'];
  const colorClass = AVATAR_COLORS[(profile.user_name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Edit Profile</h2>

      {/* Photo */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative shrink-0">
          {profile.profile_photo ? (
            <img src={profile.profile_photo} alt={profile.user_name} className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100 dark:ring-slate-800" />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl ${colorClass}`}>
              {profile.user_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          {uploadingPhoto && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
        <div>
          <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto} className="btn-secondary text-sm">
            {uploadingPhoto ? 'Uploading…' : 'Change Photo'}
          </button>
          <p className="text-xs text-slate-400 mt-1">JPEG or PNG, max 2MB</p>
          <input ref={photoRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoUpload} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Bio</label>
          <textarea rows={3} className="input-field h-auto py-2.5 resize-none" placeholder="Tell customers about your experience…" {...register('bio')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">City <span className="text-red-500">*</span></label>
            <input type="text" className="input-field" placeholder="Kathmandu" {...register('city', { required: 'Required' })} />
            <InlineError message={errors.city?.message} />
          </div>
          <div>
            <label className="label">Area <span className="text-red-500">*</span></label>
            <input type="text" className="input-field" placeholder="Thamel" {...register('area', { required: 'Required' })} />
            <InlineError message={errors.area?.message} />
          </div>
        </div>
        <div>
          <label className="label">Hourly Rate (Rs.) <span className="text-red-500">*</span></label>
          <input type="number" min="0" className="input-field" placeholder="500" {...register('hourly_rate', { required: 'Required' })} />
          <InlineError message={errors.hourly_rate?.message} />
        </div>
        <div>
          <label className="label">Services (comma-separated)</label>
          <input type="text" className="input-field" placeholder="Plumbing, Electrical, Cleaning" {...register('services')} />
          <p className="text-xs text-slate-400 mt-1">Separate multiple services with commas.</p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [updatingId, setUpdatingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('jobs');
  const [identity, setIdentity] = useState(null);
  const [witnesses, setWitnesses] = useState([]);
  const [categories, setCategories] = useState([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const servicePreset = watch('servicePreset');

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const p = await getMyProviderProfile();
      setProfile(p);
      if (p.is_approved) fetchBookings();
    } catch (err) {
      if (err?.response?.status === 404) setProfile(null);
      else addToast('Failed to load provider profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchIdentity = async () => {
    try { setIdentity(await getMyIdentity()); } catch {}
  };

  const fetchWitnesses = async () => {
    try { setWitnesses(await getMyWitnesses()); } catch {}
  };

  const fetchCategories = async () => {
    try { setCategories(await getCategories()); } catch {}
  };

  useEffect(() => {
    fetchProfile();
    fetchIdentity();
    fetchWitnesses();
    fetchCategories();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await getIncomingBookings());
    } catch {
      setError('Could not load incoming bookings.');
    } finally {
      setLoading(false);
    }
  };

  const onApply = async (data) => {
    setSubmitting(true);
    try {
      const finalServices = data.servicePreset === 'Other'
        ? data.customService.split(',').map((s) => s.trim()).filter(Boolean)
        : [data.servicePreset];
      if (finalServices.length === 0) { addToast('Please provide at least one service.', 'error'); setSubmitting(false); return; }
      const p = await applyAsProvider({ ...data, services: finalServices, hourly_rate: parseFloat(data.hourly_rate) });
      setProfile(p);
      addToast('Application submitted! Now add your identity and invite witnesses.', 'success');
      setActiveSection('identity');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Application failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      const updated = await updateBookingStatus(bookingId, newStatus);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? updated : b));
      addToast(`Booking marked as ${newStatus}.`, 'success');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not update booking status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  if (profileLoading) return <Layout width="form"><LoadingSpinner fullPage /></Layout>;

  // ── ONBOARDING VIEW ──
  if (!profile) {
    return (
      <Layout title="Become a provider" width="form">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Complete Your Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Submit your details to start receiving bookings.</p>
          </div>
          <div className="card p-6">
            <form onSubmit={handleSubmit(onApply)} className="space-y-4">
              <div>
                <label htmlFor="bio" className="label">Bio</label>
                <textarea id="bio" rows={3} className="input-field h-auto py-2.5 resize-none" placeholder="Tell customers about your experience…" {...register('bio')} />
              </div>
              <div>
                <label htmlFor="servicePreset" className="label">Primary Service <span className="text-red-500">*</span></label>
                <select id="servicePreset" className="input-field" {...register('servicePreset', { required: 'Please select a service' })}>
                  <option value="">Select a service…</option>
                  {categories.filter((c) => c.is_active).map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {categories.length === 0 && (
                    <>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Tutoring">Tutoring</option>
                      <option value="Painting">Painting</option>
                      <option value="Carpentry">Carpentry</option>
                    </>
                  )}
                  <option value="Other">Other (Specify)</option>
                </select>
                <InlineError message={errors.servicePreset?.message} />
              </div>
              {servicePreset === 'Other' && (
                <div className="animate-fade-in">
                  <label htmlFor="customService" className="label">Specify Service <span className="text-red-500">*</span></label>
                  <input id="customService" type="text" className="input-field" placeholder="E.g. Web Development"
                    {...register('customService', { required: 'Please specify your service' })} />
                  <InlineError message={errors.customService?.message} />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="label">City <span className="text-red-500">*</span></label>
                  <input id="city" type="text" className="input-field" placeholder="Kathmandu" {...register('city', { required: 'City is required' })} />
                  <InlineError message={errors.city?.message} />
                </div>
                <div>
                  <label htmlFor="area" className="label">Area <span className="text-red-500">*</span></label>
                  <input id="area" type="text" className="input-field" placeholder="Thamel" {...register('area', { required: 'Area is required' })} />
                  <InlineError message={errors.area?.message} />
                </div>
              </div>
              <div>
                <label htmlFor="hourly_rate" className="label">Hourly Rate (Rs.) <span className="text-red-500">*</span></label>
                <input id="hourly_rate" type="number" min="0" step="0.01" className="input-field" placeholder="500"
                  {...register('hourly_rate', { required: 'Hourly rate is required' })} />
                <InlineError message={errors.hourly_rate?.message} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
                {submitting ? 'Submitting…' : 'Apply as Provider'}
              </button>
            </form>
          </div>
      </Layout>
    );
  }

  // ── PENDING APPROVAL VIEW (not approved, has profile) ──
  if (!profile.is_approved) {
    const vouchedCount = witnesses.filter((w) => w.vouch_status === 'vouched').length;
    const identityStatus = identity?.verification_status || 'unverified';

    return (
      <Layout title="Set up your profile" width="form">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Provider Setup</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Complete these steps to get approved.</p>
          </div>

          {/* Progress steps */}
          <div className="card p-5 mb-6">
            <div className="flex items-center gap-4">
              {[
                { label: 'Profile Submitted', done: true },
                { label: 'Identity Submitted', done: identityStatus !== 'unverified' },
                { label: '3 Witnesses', done: vouchedCount >= 3 },
                { label: 'Admin Approval', done: false },
              ].map((step, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight ${step.done ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tab switcher for setup sections */}
          <div className="flex gap-1 p-1 bg-bg-subtle rounded-xl mb-5 overflow-x-auto scrollbar-none">
            {['identity', 'witnesses', 'profile'].map((s) => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
                  ${activeSection === s ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {s === 'identity' ? 'Identity' : s === 'witnesses' ? `Witnesses (${vouchedCount}/3)` : 'Edit Profile'}
              </button>
            ))}
          </div>

          {activeSection === 'identity' && (
            <IdentitySection identity={identity} onRefresh={fetchIdentity} />
          )}
          {activeSection === 'witnesses' && (
            <WitnessSection witnesses={witnesses} onRefresh={fetchWitnesses} profile={profile} />
          )}
          {activeSection === 'profile' && (
            <ProfileEditSection profile={profile} categories={categories} onSaved={fetchProfile} />
          )}
      </Layout>
    );
  }

  // ── APPROVED DASHBOARD VIEW ──
  return (
    <Layout title="My dashboard">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Provider Dashboard</h1>
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </span>
              {profile.trust_score > 0 && (
                <span className="text-xs text-slate-500 font-medium">Trust: {profile.trust_score}/100</span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {user?.name} ·{' '}
              {pendingCount > 0
                ? <span className="text-amber-600 font-medium">{pendingCount} pending booking{pendingCount !== 1 ? 's' : ''}</span>
                : 'No pending bookings'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSection(activeSection === 'settings' ? 'jobs' : 'settings')}
              className="btn-secondary text-sm"
            >
              {activeSection === 'settings' ? 'Back to Jobs' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {activeSection === 'settings' ? (
          <div className="space-y-5">
            <ProfileEditSection profile={profile} categories={categories} onSaved={() => { fetchProfile(); setActiveSection('jobs'); }} />
            <IdentitySection identity={identity} onRefresh={fetchIdentity} />
            <WitnessSection witnesses={witnesses} onRefresh={fetchWitnesses} profile={profile} />
          </div>
        ) : (
          <>
            {/* Stats */}
            {bookings.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {['pending', 'accepted', 'completed', 'cancelled'].map((s) => {
                  const count = bookings.filter((b) => b.status === s).length;
                  const colors = { pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', accepted: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300', completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' };
                  return (
                    <div key={s} className={`rounded-xl p-3 text-center ${colors[s]}`}>
                      <div className="text-xl font-bold tabular-nums">{count}</div>
                      <div className="text-xs capitalize mt-0.5">{s}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl mb-6 overflow-x-auto">
              {STATUS_TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                  <span className="capitalize">{tab}</span>
                </button>
              ))}
            </div>

            {loading ? <LoadingSpinner />
              : error ? <ErrorMessage message={error} onRetry={fetchBookings} />
              : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">No bookings here</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 capitalize">No {activeTab === 'all' ? '' : activeTab} bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((booking) => (
                    <div key={booking.id} className={updatingId === booking.id ? 'opacity-60 pointer-events-none' : ''}>
                      <BookingCard booking={booking} role="provider" onStatusChange={handleStatusChange} />
                    </div>
                  ))}
                </div>
              )}
          </>
        )}
    </Layout>
  );
}
