import { formatDate } from '../utils/helpers';
import { bookingStatus, StatusBadge } from '../utils/appearance';

const SLOT_HINTS = {
  morning: '8 AM – 12 PM',
  afternoon: '12 PM – 5 PM',
  evening: '5 PM – 8 PM',
};

function Row({ icon, children, muted = false }) {
  return (
    <div className={`flex items-start gap-2 text-body-sm ${muted ? 'text-text-subtle' : 'text-text-muted'}`}>
      <span className="text-text-subtle shrink-0 mt-0.5">{icon}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

const CalendarIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
  </svg>
);

const PinIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9.5 9.5 0 1119 0z" />
  </svg>
);

const NoteIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

const InfoIcon = (
  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

// Bookings are immutable once created: the API exposes status transitions
// only, no content edits. Each state spells out what recourse remains.
export default function BookingCard({ booking, onStatusChange, onCancel, onReport, role }) {
  const {
    id,
    status,
    scheduled_date,
    time_slot,
    address,
    notes,
    cancellation_reason,
    provider_name,
    customer_name,
    category_name,
    cancelled_by,
    has_dispute,
  } = booking;

  const appearance = bookingStatus(status);

  const counterparty = role === 'provider' ? customer_name : provider_name;
  const counterpartyLabel = role === 'provider' ? 'Booked by' : 'Provider';

  const canAccept = role === 'provider' && status === 'pending';
  const canComplete = role === 'provider' && status === 'accepted';
  const canDecline = role === 'provider' && status === 'pending';
  const canProviderCancel = role === 'provider' && status === 'accepted';
  const canCustomerCancel = role === 'customer' && status === 'pending';
  // A finished booking has an outcome to dispute; earlier states are still cancellable instead.
  const canReport = Boolean(onReport) && ['completed', 'cancelled'].includes(status) && !has_dispute;

  const hasActions =
    canAccept || canComplete || canDecline || canProviderCancel || canCustomerCancel || canReport;

  // 'cancelled' covers both parties, so name who acted.
  const cancelledNarrative = () => {
    if (status !== 'cancelled') return null;
    if (cancelled_by === 'customer') {
      return role === 'provider' ? 'The customer cancelled this request.' : 'You cancelled this booking.';
    }
    if (cancelled_by === 'provider') {
      return role === 'customer'
        ? 'The provider was unable to take this booking.'
        : 'You cancelled this booking.';
    }
    return null;
  };

  return (
    <article className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-h3 text-text truncate">
            {category_name || 'Service booking'}
          </h3>
          {counterparty && (
            <p className="text-body-sm text-text-muted mt-0.5">
              {counterpartyLabel} · <span className="text-text font-medium">{counterparty}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge appearance={appearance} />
          <span className="text-caption text-text-subtle tabular">#{id}</span>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Row icon={CalendarIcon}>
          <span className="tabular">{formatDate(scheduled_date)}</span>
          {time_slot && (
            <span className="text-text-subtle">
              {' · '}
              <span className="capitalize">{time_slot}</span>
              {SLOT_HINTS[time_slot] && ` (${SLOT_HINTS[time_slot]})`}
            </span>
          )}
        </Row>

        <Row icon={PinIcon}>
          <span className="line-clamp-2">{address}</span>
        </Row>

        {notes && (
          <Row icon={NoteIcon} muted>
            <span className="line-clamp-2">{notes}</span>
          </Row>
        )}
      </div>

      {status === 'cancelled' && (cancelledNarrative() || cancellation_reason) && (
        <div className="callout-danger mt-4">
          {InfoIcon}
          <div className="min-w-0">
            {cancelledNarrative() && <p className="font-medium">{cancelledNarrative()}</p>}
            {cancellation_reason && (
              <p className={cancelledNarrative() ? 'mt-0.5' : ''}>
                Reason: {cancellation_reason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Immutability, stated where the customer would otherwise look for edit. */}
      {role === 'customer' && status === 'pending' && (
        <div className="callout-info mt-4">
          {InfoIcon}
          <p>
            Booking details can&apos;t be changed. If something is wrong, cancel now and
            rebook — once the provider accepts, this booking is locked in.
          </p>
        </div>
      )}

      {role === 'customer' && status === 'accepted' && (
        <div className="callout-warning mt-4">
          {InfoIcon}
          <p>
            {provider_name || 'The provider'} has accepted and is planning around this
            slot, so it can no longer be cancelled or changed here. Contact them directly
            if your details have changed.
          </p>
        </div>
      )}

      {hasActions && (
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
          {canAccept && (
            <button onClick={() => onStatusChange(id, 'accepted')} className="btn-primary btn-sm">
              Accept
            </button>
          )}
          {canComplete && (
            <button onClick={() => onStatusChange(id, 'completed')} className="btn-primary btn-sm">
              Mark complete
            </button>
          )}
          {canDecline && (
            <button onClick={() => onStatusChange(id, 'cancelled')} className="btn-ghost btn-sm text-danger">
              Decline
            </button>
          )}
          {canProviderCancel && (
            <button onClick={() => onStatusChange(id, 'cancelled')} className="btn-ghost btn-sm text-danger">
              Cancel booking
            </button>
          )}
          {canCustomerCancel && (
            <button onClick={() => onCancel?.(booking)} className="btn-ghost btn-sm text-danger">
              Cancel booking
            </button>
          )}
          {canReport && (
            <button onClick={() => onReport(booking)} className="btn-ghost btn-sm">
              Report a problem
            </button>
          )}
        </div>
      )}

      {has_dispute && (
        <p className="mt-3 text-caption text-text-subtle">
          You reported a problem with this booking. An admin is reviewing it.
        </p>
      )}
    </article>
  );
}
