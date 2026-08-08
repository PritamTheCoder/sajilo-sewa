import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getMyBookings, cancelBooking } from '../api/bookings';
import { createReview } from '../api/reviews';
import { getMyListings, closeJobListing, awardJob } from '../api/jobs';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookingCard from '../components/BookingCard';
import ReportDialog from '../components/ReportDialog';
import ErrorMessage, { InlineError } from '../components/ErrorMessage';
import Layout, { SidebarNav } from '../components/Layout';
import Dialog, { ConfirmDialog } from '../components/Dialog';
import { SkeletonList, BookingCardSkeleton, JobCardSkeleton } from '../components/Skeletons';
import { StarRatingInput } from '../components/StarRating';
import { getSidebarSections } from '../components/nav/navConfig';
import { jobStatus, StatusBadge } from '../utils/appearance';

const STATUS_TABS = ['all', 'pending', 'accepted', 'completed', 'cancelled'];

const TAB_STRIP = 'flex gap-1 p-1 bg-bg-subtle rounded-xl';
const tabBtn = (active) =>
  active
    ? 'bg-surface text-text shadow-sm font-semibold'
    : 'text-text-muted hover:text-text font-medium';

/* ─── Review ──────────────────────────────────────────────────────────────── */

function ReviewModal({ booking, onClose, onSubmitted }) {
  const { addToast } = useToast();
  const [rating, setRating] = useState(0);
  const [ratingError, setRatingError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    // Reported inline, next to the control that failed.
    if (!rating) {
      setRatingError('Please select a star rating.');
      return;
    }
    setRatingError(null);
    setSubmitting(true);
    try {
      await createReview({
        booking_id: booking.id,
        rating,
        comment: data.comment || undefined,
      });
      addToast('Review submitted — thank you.', 'success');
      onSubmitted(booking.id);
      reset();
      onClose();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={Boolean(booking)}
      onClose={onClose}
      title="Leave a review"
      description={
        booking?.provider_name
          ? `How was your experience with ${booking.provider_name}?`
          : 'How was your experience?'
      }
      size="sm"
      footer={
        <button
          type="submit"
          form="review-form"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      }
    >
      <form id="review-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <span className="label">
            Rating <span className="text-danger">*</span>
          </span>
          <StarRatingInput
            value={rating}
            onChange={(v) => {
              setRating(v);
              setRatingError(null);
            }}
          />
          <InlineError message={ratingError} />
        </div>
        <div>
          <label htmlFor="review-comment" className="label">
            Comment
          </label>
          <textarea
            id="review-comment"
            rows={3}
            className="input-field resize-none"
            placeholder="What went well? What could have been better?"
            {...register('comment')}
          />
          <span className="hint">Your review is public and helps other customers choose.</span>
        </div>
      </form>
    </Dialog>
  );
}

/* ─── Job listings ────────────────────────────────────────────────────────── */

function JobListingCard({ job, expanded, onToggle, onClose, onAward }) {
  const appearance = jobStatus(job.status);

  return (
    <article className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <StatusBadge appearance={appearance} />
            {job.category_name && (
              <span className="badge bg-brand-subtle text-brand">{job.category_name}</span>
            )}
          </div>
          <h3 className="text-h3 text-text">{job.title}</h3>
          <p className="text-body-sm text-text-muted mt-0.5">
            {job.city}
            {job.area ? `, ${job.area}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-body-sm font-medium text-text-muted tabular">
            {job.application_count} applicant{job.application_count !== 1 ? 's' : ''}
          </span>
          {job.status === 'open' && (
            <button onClick={() => onClose(job)} className="btn-ghost btn-sm text-danger">
              Close
            </button>
          )}
        </div>
      </div>

      {job.application_count > 0 && (
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`applications-${job.id}`}
          className="mt-3 text-body-sm text-brand font-medium hover:text-brand-hover transition-colors duration-fast inline-flex items-center gap-1"
        >
          {expanded ? 'Hide' : 'View'} applications
          <svg
            className={`w-4 h-4 transition-transform duration-fast ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}

      {expanded && job.applications?.length > 0 && (
        <ul id={`applications-${job.id}`} className="mt-3 space-y-2 animate-fade-in">
          {job.applications.map((app) => (
            <li
              key={app.id}
              // Stacks below sm; the name, rate, status and Award button
              // collide on a narrow row otherwise.
              className="p-3 bg-bg-subtle rounded-xl border border-border
                flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="min-w-0 grow">
                <p className="text-body-sm font-medium text-text">{app.provider_name}</p>
                {app.proposed_rate && (
                  <p className="text-caption text-brand font-semibold tabular">
                    Rs. {app.proposed_rate.toLocaleString()}
                  </p>
                )}
                {app.message && (
                  <p className="text-caption text-text-muted mt-1 line-clamp-2">{app.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-caption font-medium capitalize ${
                    app.status === 'accepted'
                      ? 'text-success'
                      : app.status === 'rejected'
                      ? 'text-danger'
                      : 'text-text-subtle'
                  }`}
                >
                  {app.status}
                </span>
                {job.status === 'open' && app.status === 'pending' && (
                  <button onClick={() => onAward(job, app)} className="btn-secondary btn-sm">
                    Award
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [mainTab, setMainTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [reviewTarget, setReviewTarget] = useState(null);

  // Merged over the server's has_review flag so the button disappears
  // immediately, without waiting for a refetch.
  const [justReviewed, setJustReviewed] = useState(new Set());

  const [myJobs, setMyJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(null);
  const [expandedJob, setExpandedJob] = useState(null);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [closeTarget, setCloseTarget] = useState(null);
  const [awardTarget, setAwardTarget] = useState(null);
  const [acting, setActing] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await getMyBookings());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      setMyJobs(await getMyListings());
    } catch (err) {
      // Surfaced, so a failed fetch isn't shown as an empty listing set.
      setJobsError(err.response?.data?.detail || 'Could not load your job listings.');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchMyJobs();
  }, []);

  const handleCancel = async () => {
    setActing(true);
    try {
      const updated = await cancelBooking(cancelTarget.id, cancelReason.trim() || undefined);
      setBookings((prev) => prev.map((b) => (b.id === cancelTarget.id ? updated : b)));
      addToast('Booking cancelled.', 'success');
      setCancelTarget(null);
      setCancelReason('');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not cancel booking.', 'error');
    } finally {
      setActing(false);
    }
  };

  const handleCloseJob = async () => {
    setActing(true);
    try {
      await closeJobListing(closeTarget.id);
      addToast('Listing closed.', 'success');
      setCloseTarget(null);
      fetchMyJobs();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not close listing.', 'error');
    } finally {
      setActing(false);
    }
  };

  const handleAwardJob = async () => {
    setActing(true);
    try {
      await awardJob(awardTarget.job.id, awardTarget.app.id);
      addToast('Job awarded.', 'success');
      setAwardTarget(null);
      setExpandedJob(null);
      fetchMyJobs();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not award job.', 'error');
    } finally {
      setActing(false);
    }
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);

  const sections = getSidebarSections(user).map((s) => ({
    ...s,
    count: s.id === 'my_jobs' ? myJobs.length : undefined,
  }));

  const sidebar = <SidebarNav sections={sections} active={mainTab} onChange={setMainTab} />;

  return (
    <Layout title="My dashboard" sidebar={sidebar}>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text">My dashboard</h1>
          <p className="text-body-sm text-text-muted mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/browse" className="btn-outline btn-sm">Find providers</Link>
          <Link to="/jobs/new" className="btn-primary btn-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Post a job
          </Link>
        </div>
      </header>

      {/* Mirrors the lg+ sidebar, which takes over above lg. */}
      <div className={`${TAB_STRIP} lg:hidden mb-6 overflow-x-auto scrollbar-none`}>
        {sections.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setMainTab(id)}
            className={`shrink-0 px-4 py-1.5 rounded-lg text-body-sm transition-all duration-fast whitespace-nowrap ${tabBtn(mainTab === id)}`}
          >
            {label}
            {count > 0 && <span className="ml-1.5 text-text-subtle tabular">{count}</span>}
          </button>
        ))}
      </div>

      {/* ── Job listings ── */}
      {mainTab === 'my_jobs' && (
        <section aria-label="My job listings">
          {jobsLoading ? (
            <SkeletonList count={2}>
              <JobCardSkeleton />
            </SkeletonList>
          ) : jobsError ? (
            <ErrorMessage message={jobsError} onRetry={fetchMyJobs} />
          ) : myJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-bg-subtle rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-h3 text-text">No job listings yet</h2>
              <p className="text-body-sm text-text-muted mt-1 max-w-sm">
                Post a job and let providers come to you with their rates.
              </p>
              <Link to="/jobs/new" className="btn-primary mt-4">Post a job</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myJobs.map((job) => (
                <JobListingCard
                  key={job.id}
                  job={job}
                  expanded={expandedJob === job.id}
                  onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  onClose={setCloseTarget}
                  onAward={(j, app) => setAwardTarget({ job: j, app })}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Bookings ── */}
      {mainTab === 'bookings' && (
        <section aria-label="My bookings">
          <div className={`${TAB_STRIP} mb-6 overflow-x-auto scrollbar-none`}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-current={activeTab === tab ? 'true' : undefined}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-body-sm transition-all duration-fast ${tabBtn(activeTab === tab)}`}
              >
                <span className="capitalize">{tab}</span>
                {tab !== 'all' && (
                  <span className="ml-1.5 text-caption text-text-subtle tabular">
                    {bookings.filter((b) => b.status === tab).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <SkeletonList count={3} className="space-y-3">
              <BookingCardSkeleton />
            </SkeletonList>
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchBookings} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-bg-subtle rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
              </div>
              <h2 className="text-h3 text-text">No bookings found</h2>
              <p className="text-body-sm text-text-muted mt-1">
                {activeTab === 'all'
                  ? "You haven't made any bookings yet."
                  : `No ${activeTab} bookings.`}
              </p>
              {activeTab === 'all' && (
                <Link to="/browse" className="btn-primary mt-4">Browse providers</Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((booking) => {
                const reviewed = booking.has_review || justReviewed.has(booking.id);
                return (
                  <div key={booking.id}>
                    <BookingCard
                      booking={booking}
                      role="customer"
                      onCancel={(b) => {
                        setCancelReason('');
                        setCancelTarget(b);
                      }}
                      onReport={setReportTarget}
                    />
                    {booking.status === 'completed' && !reviewed && (
                      <div className="mt-2 pl-1">
                        <button
                          onClick={() => setReviewTarget(booking)}
                          className="text-body-sm text-brand font-medium hover:text-brand-hover transition-colors duration-fast inline-flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                          Leave a review
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <ReviewModal
        booking={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmitted={(id) => setJustReviewed((prev) => new Set([...prev, id]))}
      />

      {reportTarget && (
        <ReportDialog
          booking={reportTarget}
          onClose={() => setReportTarget(null)}
          onReported={(id) =>
            setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, has_dispute: true } : b)))
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={acting}
        title="Cancel this booking?"
        description="This can't be undone. You'll need to make a new booking if you change your mind."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
      >
        <label htmlFor="cancel-reason" className="label">
          Reason <span className="text-text-subtle font-normal">(optional)</span>
        </label>
        <textarea
          id="cancel-reason"
          rows={2}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="input-field resize-none"
          placeholder="e.g. I entered the wrong address"
        />
        <span className="hint">Shared with the provider so they know what happened.</span>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(closeTarget)}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleCloseJob}
        loading={acting}
        title="Close this listing?"
        description={
          closeTarget
            ? `"${closeTarget.title}" will stop accepting applications. Existing applicants won't be notified.`
            : ''
        }
        confirmLabel="Close listing"
        cancelLabel="Keep it open"
      />

      {/* Irreversible: closes the listing and turns down every other applicant. */}
      <ConfirmDialog
        open={Boolean(awardTarget)}
        onClose={() => setAwardTarget(null)}
        onConfirm={handleAwardJob}
        loading={acting}
        tone="primary"
        title="Award this job?"
        confirmLabel="Award job"
        cancelLabel="Not yet"
      >
        {awardTarget && (
          <div className="space-y-3">
            <div className="card p-4 bg-bg-subtle">
              <p className="text-caption text-text-subtle">Provider</p>
              <p className="text-body font-semibold text-text">{awardTarget.app.provider_name}</p>
              {awardTarget.app.proposed_rate && (
                <>
                  <p className="text-caption text-text-subtle mt-2">Proposed rate</p>
                  <p className="text-body font-semibold text-text tabular">
                    Rs. {awardTarget.app.proposed_rate.toLocaleString()}
                  </p>
                </>
              )}
              <p className="text-caption text-text-subtle mt-2">Job</p>
              <p className="text-body-sm text-text">{awardTarget.job.title}</p>
            </div>
            <p className="text-body-sm text-text-muted">
              This closes the listing and turns down the other applicants. It can&apos;t be undone.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </Layout>
  );
}
