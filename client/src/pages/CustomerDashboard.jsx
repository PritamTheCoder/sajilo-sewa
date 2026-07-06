import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getMyBookings, cancelBooking } from '../api/bookings';
import { createReview } from '../api/reviews';
import { getMyListings, closeJobListing, awardJob } from '../api/jobs';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookingCard from '../components/BookingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Navbar from '../components/Navbar';
import { StarRatingInput } from '../components/StarRating';
import { InlineError } from '../components/ErrorMessage';

function ReviewModal({ booking, onClose, onSubmitted }) {
  const { addToast } = useToast();
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (!rating) { addToast('Please select a star rating.', 'error'); return; }
    setSubmitting(true);
    try {
      await createReview({ booking_id: booking.id, rating, comment: data.comment || undefined });
      addToast('Review submitted! Thank you.', 'success');
      onSubmitted();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Could not submit review.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Submit review">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Leave a Review</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Rating <span className="text-red-500">*</span></label>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>
          <div>
            <label htmlFor="review-comment" className="label">Comment</label>
            <textarea
              id="review-comment"
              rows={3}
              className="input-field h-auto py-2.5 resize-none"
              placeholder="How was your experience?"
              {...register('comment')}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

const STATUS_TABS = ['all', 'pending', 'accepted', 'completed', 'cancelled'];
const MAIN_TABS = ['bookings', 'my_jobs'];

const JOB_STATUS_COLORS = {
  open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  awarded: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  closed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

// Pill tab strip styling, shared across this dashboard (light + dark)
const TAB_STRIP = 'flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl';
const tabBtn = (active) => active
  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [mainTab, setMainTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [cancellingId, setCancellingId] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch {
      setError('Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      const updated = await cancelBooking(bookingId);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? updated : b));
      addToast('Booking cancelled.', 'success');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not cancel booking.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const fetchMyJobs = async () => {
    setJobsLoading(true);
    try { setMyJobs(await getMyListings()); } catch {}
    finally { setJobsLoading(false); }
  };

  const handleCloseJob = async (id) => {
    if (!window.confirm('Close this listing?')) return;
    try {
      await closeJobListing(id);
      addToast('Listing closed.', 'success');
      fetchMyJobs();
    } catch { addToast('Could not close listing.', 'error'); }
  };

  const handleAwardJob = async (listingId, applicationId) => {
    if (!window.confirm('Award this job to this provider?')) return;
    try {
      await awardJob(listingId, applicationId);
      addToast('Job awarded!', 'success');
      fetchMyJobs();
      setExpandedJob(null);
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not award job.', 'error');
    }
  };

  useEffect(() => { fetchBookings(); fetchMyJobs(); }, []);

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Link to="/browse" className="btn-secondary text-sm">Find Providers</Link>
            <Link to="/jobs/new" className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Post a Job
            </Link>
          </div>
        </div>

        {/* Main tabs */}
        <div className={`${TAB_STRIP} mb-6 w-fit`}>
          {[['bookings', 'My Bookings'], ['my_jobs', `My Job Listings (${myJobs.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setMainTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tabBtn(mainTab === key)}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── MY JOB LISTINGS ── */}
        {mainTab === 'my_jobs' && (
          <div>
            {jobsLoading ? <LoadingSpinner /> : myJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium">No job listings yet</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Post a job to receive applications from providers.</p>
                <Link to="/jobs/new" className="btn-primary mt-4">Post a Job</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job) => (
                  <div key={job.id} className="card p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${JOB_STATUS_COLORS[job.status]}`}>
                            {job.status}
                          </span>
                          {job.category_name && (
                            <span className="text-xs bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 px-2 py-0.5 rounded-full">{job.category_name}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{job.city}{job.area ? `, ${job.area}` : ''}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{job.application_count} applicant{job.application_count !== 1 ? 's' : ''}</span>
                        {job.status === 'open' && (
                          <button onClick={() => handleCloseJob(job.id)}
                            className="text-xs h-7 px-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-500/15 dark:hover:text-red-300 transition-colors">
                            Close
                          </button>
                        )}
                      </div>
                    </div>

                    {job.application_count > 0 && (
                      <button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="text-sm text-brand-600 dark:text-brand-300 font-medium hover:text-brand-700 transition-colors"
                      >
                        {expandedJob === job.id ? 'Hide' : 'View'} applications
                        <svg className={`inline w-4 h-4 ml-1 transition-transform ${expandedJob === job.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    )}

                    {expandedJob === job.id && job.applications?.length > 0 && (
                      <div className="mt-3 space-y-2 animate-fade-in">
                        {job.applications.map((app) => (
                          <div key={app.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{app.provider_name}</p>
                              {app.proposed_rate && (
                                <p className="text-xs text-brand-700 dark:text-brand-300 font-semibold">Rs. {app.proposed_rate.toLocaleString()}</p>
                              )}
                              {app.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{app.message}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs font-medium capitalize ${app.status === 'accepted' ? 'text-emerald-700' : app.status === 'rejected' ? 'text-red-500' : 'text-slate-500'}`}>
                                {app.status}
                              </span>
                              {job.status === 'open' && app.status === 'pending' && (
                                <button
                                  onClick={() => handleAwardJob(job.id, app.id)}
                                  className="text-xs h-7 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-semibold"
                                >
                                  Award
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY BOOKINGS ── */}
        {mainTab === 'bookings' && (
        <div>
        {/* Status tabs */}
        <div className={`${TAB_STRIP} mb-6 overflow-x-auto scrollbar-none`}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tabBtn(activeTab === tab)}`}
            >
              <span className="capitalize">{tab}</span>
              {tab !== 'all' && (
                <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">
                  ({bookings.filter((b) => b.status === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchBookings} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No bookings found</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              {activeTab === 'all' ? 'You haven\'t made any bookings yet.' : `No ${activeTab} bookings.`}
            </p>
            {activeTab === 'all' && (
              <Link to="/browse" className="btn-primary mt-4">Browse Providers</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => (
              <div key={booking.id} className={cancellingId === booking.id ? 'opacity-60 pointer-events-none' : ''}>
                <BookingCard booking={booking} role="customer" />
                <div className="mt-2 pl-1 flex items-center gap-4">
                  {booking.status === 'completed' && !reviewedIds.has(booking.id) && (
                    <button
                      onClick={() => setReviewTarget(booking)}
                      className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      Leave a review
                    </button>
                  )}
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="text-sm text-red-500 font-medium hover:text-red-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        )}
      </main>

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => setReviewedIds((prev) => new Set([...prev, reviewTarget.id]))}
        />
      )}
    </>
  );
}
