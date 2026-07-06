import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getOpenJobs } from '../api/jobs';
import { getCategories } from '../api/categories';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const STATUS_COLORS = {
  open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  awarded: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  closed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const SLOT_LABELS = {
  morning: '☀️ Morning',
  afternoon: '🌤 Afternoon',
  evening: '🌙 Evening',
  flexible: '🔄 Flexible',
};

function JobCard({ job, onApply }) {
  const { user } = useAuth();

  return (
    <div className="card p-5 hover:shadow-lg transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
              {job.status}
            </span>
            {job.category_name && (
              <span className="text-xs bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 px-2 py-0.5 rounded-full font-medium">
                {job.category_name}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">{job.title}</h3>
        </div>
        {(job.budget_min || job.budget_max) && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-brand-700 tabular-nums">
              Rs. {job.budget_min ? job.budget_min.toLocaleString() : '—'}
              {job.budget_max ? ` – ${job.budget_max.toLocaleString()}` : '+'}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Budget</p>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">{job.description}</p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9.5 9.5 0 1119 0z" />
          </svg>
          {job.city}{job.area ? `, ${job.area}` : ''}
        </span>
        {job.scheduled_date && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
            </svg>
            {new Date(job.scheduled_date).toLocaleDateString('en-NP')}
            {job.time_slot && ` · ${SLOT_LABELS[job.time_slot] || job.time_slot}`}
          </span>
        )}
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21" />
          </svg>
          {job.application_count} applied
        </span>
        <span>Posted by {job.customer_name}</span>
      </div>

      {user?.role === 'provider' && job.status === 'open' && (
        <button
          onClick={() => onApply(job)}
          className="btn-primary w-full text-sm"
        >
          Apply for this Job
        </button>
      )}
      {!user && (
        <Link to="/login" className="btn-secondary w-full text-sm text-center block">
          Log in to Apply
        </Link>
      )}
    </div>
  );
}

function ApplyModal({ job, onClose, onApplied }) {
  const [message, setMessage] = useState('');
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = { addToast: () => {} }; // fallback

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { applyToJob } = await import('../api/jobs');
      await applyToJob(job.id, {
        message: message || undefined,
        proposed_rate: rate ? parseFloat(rate) : undefined,
      });
      onApplied();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Apply for Job</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 font-medium">{job.title}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Your Rate (Rs.) — optional</label>
            <input
              type="number"
              min="0"
              className="input-field"
              placeholder="Your quote for this job"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Message to Customer — optional</label>
            <textarea
              rows={4}
              className="input-field h-auto py-2.5 resize-none"
              placeholder="Briefly describe your experience with this type of work…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JobListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyTarget, setApplyTarget] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());

  const city = searchParams.get('city') || '';
  const categoryId = searchParams.get('category_id') || '';

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (city) params.city = city;
      if (categoryId) params.category_id = categoryId;
      setJobs(await getOpenJobs(params));
    } catch {
      setError('Could not load job listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    getCategories().then(setCategories).catch(() => {});
  }, [city, categoryId]);

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    setSearchParams(p);
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Listings</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Customers posting jobs they need done — apply directly.</p>
          </div>
          <Link to="/jobs/new" className="btn-primary self-start sm:self-auto">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Post a Job
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <input
            type="text"
            className="input-field max-w-[160px]"
            placeholder="City…"
            value={city}
            onChange={(e) => setFilter('city', e.target.value)}
          />
          <select
            className="input-field max-w-[200px]"
            value={categoryId}
            onChange={(e) => setFilter('category_id', e.target.value)}
          >
            <option value="">All categories</option>
            {categories.filter((c) => c.is_active).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {(city || categoryId) && (
            <button onClick={() => setSearchParams({})} className="btn-ghost text-sm text-slate-500">
              Clear filters
            </button>
          )}
        </div>

        {loading ? <LoadingSpinner />
          : error ? <ErrorMessage message={error} onRetry={fetchJobs} />
          : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">No job listings yet</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Be the first to post a job in this area.</p>
              <Link to="/jobs/new" className="btn-primary mt-4">Post a Job</Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{jobs.length} open listing{jobs.length !== 1 ? 's' : ''}</p>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={(j) => appliedIds.has(j.id) ? alert('Already applied!') : setApplyTarget(j)}
                />
              ))}
            </div>
          )
        }
      </main>

      {applyTarget && (
        <ApplyModal
          job={applyTarget}
          onClose={() => setApplyTarget(null)}
          onApplied={() => {
            setAppliedIds((prev) => new Set([...prev, applyTarget.id]));
            fetchJobs();
          }}
        />
      )}
    </>
  );
}
