import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProviderById } from '../api/providers';
import { getProviderReviews, updateReview, deleteReview, replyToReview } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StarRating, { StarRatingInput } from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { ConfirmDialog } from '../components/Dialog';
import Layout from '../components/Layout';
import { formatDate } from '../utils/helpers';
import { avatarColor, avatarInitial, identityStatus, StatusBadge } from '../utils/appearance';

const EDIT_WINDOW_DAYS = 7;

function ReviewItem({ review, currentUser, onChanged, onDeleted }) {
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || '');
  const [reply, setReply] = useState(review.provider_reply || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const isAuthor = currentUser?.id === review.customer_id;
  const isProvider = currentUser?.id === review.provider_id;
  const isAdmin = currentUser?.role === 'admin';

  const withinWindow =
    (Date.now() - new Date(review.created_at).getTime()) / 86400000 <= EDIT_WINDOW_DAYS;
  const canEdit = isAuthor && withinWindow && !review.provider_reply;

  const handleSave = async () => {
    setBusy(true);
    try {
      onChanged(await updateReview(review.id, { rating, comment }));
      addToast('Review updated.', 'success');
      setEditing(false);
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not update this review.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteReview(review.id);
      addToast('Review deleted.', 'success');
      onDeleted(review.id);
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not delete this review.', 'error');
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const handleReply = async () => {
    setBusy(true);
    try {
      onChanged(await replyToReview(review.id, reply));
      addToast('Reply posted.', 'success');
      setReplying(false);
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not post your reply.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <StarRatingInput value={rating} onChange={setRating} />
        ) : (
          <div className="min-w-0">
            <StarRating rating={review.rating} size="sm" />
            {review.customer_name && (
              <p className="text-caption text-text-subtle mt-1 truncate">{review.customer_name}</p>
            )}
          </div>
        )}
        <time dateTime={review.created_at} className="text-caption text-text-subtle shrink-0">
          {formatDate(review.created_at)}
          {review.edited_at && ' · edited'}
        </time>
      </div>

      {editing ? (
        <div className="mt-3 space-y-3">
          <label htmlFor={`edit-${review.id}`} className="sr-only">Review comment</label>
          <textarea
            id={`edit-${review.id}`}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input-field h-auto py-2.5 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={busy} className="btn-primary btn-sm">
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={() => setEditing(false)} disabled={busy} className="btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        review.comment && <p className="mt-2 text-body-sm text-text-muted">{review.comment}</p>
      )}

      {review.provider_reply && !replying && (
        <div className="mt-3 pl-3 border-l-2 border-brand-subtle">
          <p className="text-caption font-semibold text-text">Response from the provider</p>
          <p className="text-body-sm text-text-muted mt-1">{review.provider_reply}</p>
        </div>
      )}

      {replying && (
        <div className="mt-3 space-y-3">
          <label htmlFor={`reply-${review.id}`} className="sr-only">Your reply</label>
          <textarea
            id={`reply-${review.id}`}
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Thanks for the feedback…"
            className="input-field h-auto py-2.5 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleReply} disabled={busy || !reply.trim()} className="btn-primary btn-sm">
              {busy ? 'Posting…' : 'Post reply'}
            </button>
            <button onClick={() => setReplying(false)} disabled={busy} className="btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editing && !replying && (canEdit || isAuthor || isAdmin || isProvider) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {canEdit && (
            <button onClick={() => setEditing(true)} className="btn-ghost btn-sm">Edit</button>
          )}
          {(isAuthor || isAdmin) && (
            <button onClick={() => setConfirmDelete(true)} className="btn-ghost btn-sm text-danger">
              Delete
            </button>
          )}
          {isProvider && (
            <button onClick={() => setReplying(true)} className="btn-ghost btn-sm">
              {review.provider_reply ? 'Edit reply' : 'Reply'}
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={busy}
        title="Delete this review?"
        description="This cannot be undone. The provider's rating will be recalculated."
        confirmLabel="Delete"
      />
    </article>
  );
}

export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [providerData, reviewData] = await Promise.all([
        getProviderById(id),
        getProviderReviews(id),
      ]);
      setProvider(providerData);
      setReviews(reviewData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load this provider. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBook = () => {
    if (!user) {
      // Preserve where they were headed so login can return them here.
      navigate(`/login?redirect=/book/${id}`);
      return;
    }
    navigate(`/book/${id}`);
  };

  if (loading) {
    return (
      <Layout width="reading">
        <LoadingSpinner fullPage />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout width="reading">
        <ErrorMessage message={error} onRetry={fetchData} />
      </Layout>
    );
  }

  if (!provider) return null;

  const name = provider.user_name || 'Provider';
  const rating = parseFloat(provider.average_rating) || 0;
  const showPhoto = provider.profile_photo && !imgFailed;
  const verified = provider.identity_status === 'verified';

  return (
    <Layout title={name} width="reading">
      <div className="card p-6 mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-5">
          {showPhoto ? (
            <img
              src={provider.profile_photo}
              alt={`${name}'s profile photo`}
              width={96}
              height={96}
              onError={() => setImgFailed(true)}
              className="w-24 h-24 rounded-2xl object-cover shrink-0"
            />
          ) : (
            <div
              className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0 ${avatarColor(name)}`}
              aria-hidden="true"
            >
              {avatarInitial(name)}
            </div>
          )}

          <div className="grow min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-h1 text-text">{name}</h1>
                  {verified && <StatusBadge appearance={identityStatus('verified')} />}
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-body-sm text-text-muted">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9.5 9.5 0 1119 0z" />
                  </svg>
                  <span>{provider.city}{provider.area ? `, ${provider.area}` : ''}</span>
                </div>

                {rating > 0 && (
                  <div className="mt-2">
                    <StarRating rating={rating} showCount reviewCount={provider.review_count} />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                {provider.hourly_rate && (
                  <div className="sm:text-right">
                    <span className="text-h2 text-text tabular">
                      Rs. {Number(provider.hourly_rate).toLocaleString()}
                    </span>
                    <span className="text-body-sm text-text-subtle ml-1">/hour</span>
                    <p className="text-caption text-text-subtle mt-0.5">Pay on arrival</p>
                  </div>
                )}
                {(!user || user.role === 'customer') && (
                  <button onClick={handleBook} className="btn-primary w-full sm:w-auto">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                    </svg>
                    Book now
                  </button>
                )}
                {!user && (
                  <p className="text-caption text-text-subtle sm:text-right">
                    You&apos;ll be asked to log in first.
                  </p>
                )}
              </div>
            </div>

            {provider.bio && (
              <p className="mt-4 text-body-sm text-text-muted">{provider.bio}</p>
            )}
          </div>
        </div>

        {provider.services?.length > 0 && (
          <div className="mt-5 pt-5 border-t border-border">
            <h2 className="text-caption font-semibold text-text-subtle uppercase tracking-wider mb-2">
              Services
            </h2>
            <div className="flex flex-wrap gap-2">
              {provider.services.map((s) => (
                <span key={s} className="badge bg-brand-subtle text-brand text-body-sm px-3 py-1">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <section aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-h2 text-text mb-4">
          Reviews
          {reviews.length > 0 && (
            <span className="ml-2 text-body-sm font-normal text-text-subtle tabular">
              ({reviews.length})
            </span>
          )}
        </h2>

        {reviews.length === 0 ? (
          <div className="card p-8 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <p className="text-body font-medium text-text">No reviews yet</p>
            <p className="text-body-sm text-text-muted mt-1">
              Be the first to review after your booking.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                currentUser={user}
                onChanged={(updated) =>
                  setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
                }
                onDeleted={(id) => setReviews((prev) => prev.filter((r) => r.id !== id))}
              />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
