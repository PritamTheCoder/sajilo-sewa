import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getOpenJobs, applyToJob } from '../api/jobs';
import { getCategories } from '../api/categories';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import Dialog from '../components/Dialog';
import ErrorMessage, { InlineError } from '../components/ErrorMessage';
import { SkeletonList, JobCardSkeleton } from '../components/Skeletons';
import { jobStatus, StatusBadge } from '../utils/appearance';

// Emoji is kept out of the announced label.
const SLOT_LABELS = {
  morning: { emoji: '☀️', label: 'Morning' },
  afternoon: { emoji: '🌤', label: 'Afternoon' },
  evening: { emoji: '🌙', label: 'Evening' },
  flexible: { emoji: '🔄', label: 'Flexible' },
};

function SlotLabel({ slot }) {
  const s = SLOT_LABELS[slot];
  if (!s) return <span>{slot}</span>;
  return (
    <span>
      <span aria-hidden="true">{s.emoji} </span>
      {s.label}
    </span>
  );
}

function JobCard({ job, applied, onApply }) {
  const { user } = useAuth();

  return (
    <article className="card-hover p-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <StatusBadge appearance={jobStatus(job.status)} />
            {job.category_name && (
              <span className="badge bg-brand-subtle text-brand">{job.category_name}</span>
            )}
          </div>
          <h3 className="text-h3 text-text">{job.title}</h3>
        </div>

        {(job.budget_min || job.budget_max) && (
          <div className="shrink-0 sm:text-right">
            <p className="text-body-sm font-bold text-brand tabular">
              Rs. {job.budget_min ? job.budget_min.toLocaleString() : '—'}
              {job.budget_max ? ` – ${job.budget_max.toLocaleString()}` : '+'}
            </p>
            <p className="text-[10px] text-text-subtle uppercase tracking-wide">Budget</p>
          </div>
        )}
      </div>

      <p className="text-body-sm text-text-muted line-clamp-2 mb-3">{job.description}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption text-text-subtle mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9.5 9.5 0 1119 0z" />
          </svg>
          {job.city}{job.area ? `, ${job.area}` : ''}
        </span>
        {job.scheduled_date && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
            </svg>
            {new Date(job.scheduled_date).toLocaleDateString('en-GB')}
            {job.time_slot && (
              <>
                {' · '}
                <SlotLabel slot={job.time_slot} />
              </>
            )}
          </span>
        )}
        <span className="tabular">{job.application_count} applied</span>
        <span>Posted by {job.customer_name}</span>
      </div>

      {user?.role === 'provider' && job.status === 'open' && (
        <button
          onClick={() => onApply(job)}
          disabled={applied}
          className="btn-primary w-full"
        >
          {applied ? 'Application sent' : 'Apply for this job'}
        </button>
      )}
      {!user && (
        <Link to={`/login?redirect=/jobs`} className="btn-outline w-full">
          Log in to apply
        </Link>
      )}
    </article>
  );
}

function ApplyModal({ job, onClose, onApplied }) {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await applyToJob(job.id, {
        message: data.message || undefined,
        proposed_rate: data.rate ? parseFloat(data.rate) : undefined,
      });
      addToast('Application sent.', 'success');
      reset();
      onApplied();
      onClose();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not submit application.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={Boolean(job)}
      onClose={onClose}
      title="Apply for job"
      description={job?.title}
      size="sm"
      footer={
        <button type="submit" form="apply-form" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      }
    >
      <form id="apply-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="apply-rate" className="label">Your rate (Rs.)</label>
          <input
            id="apply-rate"
            type="number"
            min="0"
            inputMode="numeric"
            aria-invalid={errors.rate ? 'true' : undefined}
            className="input-field"
            placeholder="Your quote for this job"
            {...register('rate', {
              min: { value: 0, message: 'Rate cannot be negative' },
            })}
          />
          <InlineError message={errors.rate?.message} />
          <span className="hint">Optional, but listings with a quote get picked more often.</span>
        </div>
        <div>
          <label htmlFor="apply-message" className="label">Message to customer</label>
          <textarea
            id="apply-message"
            rows={4}
            aria-invalid={errors.message ? 'true' : undefined}
            className="input-field resize-none"
            placeholder="Briefly describe your experience with this type of work…"
            {...register('message', {
              maxLength: { value: 500, message: 'Keep it under 500 characters' },
            })}
          />
          <InlineError message={errors.message?.message} />
        </div>
      </form>
    </Dialog>
  );
}

export default function JobListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriesFailed, setCategoriesFailed] = useState(false);
  const [applyTarget, setApplyTarget] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());

  const city = searchParams.get('city') || '';
  const categoryId = searchParams.get('category_id') || '';

  // Local mirror so typing stays responsive while the URL updates on a debounce.
  const [cityInput, setCityInput] = useState(city);
  const debounceRef = useRef(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (city) params.city = city;
      if (categoryId) params.category_id = categoryId;
      setJobs(await getOpenJobs(params));
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load job listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, categoryId]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategoriesFailed(true));
  }, []);

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    // replace, so typing doesn't push one history entry per keystroke.
    setSearchParams(p, { replace: true });
  };

  // Debounced so each keystroke doesn't fire its own request.
  const onCityChange = (value) => {
    setCityInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilter('city', value), 400);
  };

  const clearFilters = () => {
    setCityInput('');
    setSearchParams({}, { replace: true });
  };

  return (
    <Layout title="Jobs">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-h1 text-text">Job listings</h1>
          <p className="text-body-sm text-text-muted mt-1">
            Customers posting jobs they need done — apply directly.
          </p>
        </div>
        <Link to="/jobs/new" className="btn-primary btn-sm self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Post a job
        </Link>
      </header>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
        <div className="sm:w-44">
          <label htmlFor="job-city-filter" className="sr-only">Filter by city</label>
          <input
            id="job-city-filter"
            type="text"
            className="input-field"
            placeholder="City…"
            value={cityInput}
            onChange={(e) => onCityChange(e.target.value)}
          />
        </div>
        <div className="sm:w-52">
          <label htmlFor="job-category-filter" className="sr-only">Filter by category</label>
          <select
            id="job-category-filter"
            className="input-field"
            value={categoryId}
            disabled={categoriesFailed}
            onChange={(e) => setFilter('category_id', e.target.value)}
          >
            <option value="">{categoriesFailed ? 'Categories unavailable' : 'All categories'}</option>
            {categories.filter((c) => c.is_active).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {(city || categoryId) && (
          <button onClick={clearFilters} className="btn-ghost btn-sm self-start">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonList count={3}>
          <JobCardSkeleton />
        </SkeletonList>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchJobs} />
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-bg-subtle rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-h3 text-text">
            {city || categoryId ? 'No jobs match these filters' : 'No job listings yet'}
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            {city || categoryId
              ? 'Try widening your search.'
              : 'Be the first to post a job in this area.'}
          </p>
          {city || categoryId ? (
            <button onClick={clearFilters} className="btn-secondary mt-4">Clear filters</button>
          ) : (
            <Link to="/jobs/new" className="btn-primary mt-4">Post a job</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-body-sm text-text-muted" aria-live="polite">
            {jobs.length} open listing{jobs.length !== 1 ? 's' : ''}
          </p>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedIds.has(job.id)}
              onApply={setApplyTarget}
            />
          ))}
        </div>
      )}

      <ApplyModal
        job={applyTarget}
        onClose={() => setApplyTarget(null)}
        onApplied={() => {
          setAppliedIds((prev) => new Set([...prev, applyTarget.id]));
          fetchJobs();
        }}
      />
    </Layout>
  );
}
