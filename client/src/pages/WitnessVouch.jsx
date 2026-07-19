import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getVouchRequest, submitVouch, submitDecline } from '../api/witness';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { ConfirmDialog } from '../components/Dialog';

export default function WitnessVouch() {
  const { token } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [vouchRequest, setVouchRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // 'vouched' | 'declined'
  const [confirmDecline, setConfirmDecline] = useState(false);

  const { register, handleSubmit } = useForm();

  useEffect(() => {
    getVouchRequest(token)
      .then(setVouchRequest)
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Invalid or expired invitation link.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleVouch = async (data) => {
    if (!user) {
      // Redirect to register with token in query so we can link after
      navigate(`/register?witness_token=${token}`);
      return;
    }
    setSubmitting(true);
    try {
      await submitVouch(token, { vouch_statement: data.vouch_statement });
      setDone('vouched');
      addToast('Thank you for vouching!', 'success');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not submit vouch.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      await submitDecline(token, {});
      setDone('declined');
      setConfirmDecline(false);
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not decline.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout width="narrow"><LoadingSpinner fullPage /></Layout>;

  if (error) {
    return (
      <Layout width="narrow">
        <div className="py-12 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invalid Invitation</h1>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <Link to="/" className="btn-primary">Go to Home</Link>
        </div>
      </Layout>
    );
  }

  if (done === 'vouched') {
    return (
      <Layout width="narrow">
        <div className="py-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Thank You!</h1>
          <p className="text-slate-500 text-sm mb-6">
            You've successfully vouched for <strong>{vouchRequest?.provider_name}</strong>. Your vouch helps build trust on the platform.
          </p>
          <Link to="/browse" className="btn-primary">Browse Providers</Link>
        </div>
      </Layout>
    );
  }

  if (done === 'declined') {
    return (
      <Layout width="narrow">
        <div className="py-12 text-center">
          <p className="text-slate-500 text-sm mb-6">You have declined this vouch request.</p>
          <Link to="/" className="btn-secondary">Go to Home</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout width="narrow">
      <div className="py-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Witness Invitation</h1>
          <p className="text-slate-500 mt-2 text-sm">
            You've been invited to vouch for a service provider on Sajilo Sewa.
          </p>
        </div>

        {/* Provider info */}
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Provider Details</h2>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{vouchRequest?.provider_name || 'A Service Provider'}</p>
          {vouchRequest?.provider_city && (
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9.5 9.5 0 1119 0z" />
              </svg>
              {vouchRequest.provider_city}
            </p>
          )}
          {vouchRequest?.provider_services?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {vouchRequest.provider_services.slice(0, 4).map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* What vouching means */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-sm text-amber-800">
          <p className="font-semibold mb-1">What does vouching mean?</p>
          <p>By vouching, you confirm that you personally know this provider and believe they are trustworthy to enter customers' homes and provide services in Nepal.</p>
        </div>

        {/* Auth gate */}
        {!user ? (
          <div className="card p-6 text-center">
            <p className="text-slate-700 dark:text-slate-200 font-medium mb-1">You need an account to vouch</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Creating an account takes less than a minute. You can vouch immediately after.</p>
            <div className="flex flex-col gap-2">
              <Link
                to={`/register?witness_token=${token}`}
                className="btn-primary w-full text-center"
              >
                Create Account &amp; Vouch
              </Link>
              <Link
                to={`/login?redirect=/vouch/${token}`}
                className="btn-secondary w-full text-center"
              >
                I already have an account
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleVouch)} className="card p-6 space-y-4">
            <div>
              <label htmlFor="vouch-statement" className="label">Add a note (optional)</label>
              <textarea
                id="vouch-statement"
                rows={3}
                className="input-field resize-none"
                placeholder="How do you know this person? Why do you trust them?"
                {...register('vouch_statement')}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
              {submitting ? 'Submitting…' : 'I vouch for this provider'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDecline(true)}
              disabled={submitting}
              className="btn-ghost w-full text-text-muted hover:text-danger"
            >
              Decline this request
            </button>
          </form>
        )}
      </div>

      <ConfirmDialog
        open={confirmDecline}
        onClose={() => setConfirmDecline(false)}
        onConfirm={handleDecline}
        loading={submitting}
        title="Decline this request?"
        description="The provider will be told you couldn't vouch for them. This can't be undone, and the invitation link will stop working."
        confirmLabel="Decline"
        cancelLabel="Go back"
      />
    </Layout>
  );
}
