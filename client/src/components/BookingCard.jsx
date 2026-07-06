import { capitalise, formatDate, statusBadgeClass } from '../utils/helpers';

export default function BookingCard({ booking, onStatusChange, role }) {
  const { id, status, scheduled_date, time_slot, address, notes } = booking;

  const canAccept = role === 'provider' && status === 'pending';
  const canComplete = role === 'provider' && status === 'accepted';
  const canCancel = role === 'provider' && (status === 'pending' || status === 'accepted');

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${statusBadgeClass(status)}`}>
              {capitalise(status)}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">#{id}</span>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
              <span>{formatDate(scheduled_date)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="capitalize">{time_slot}</span>
            </div>

            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9.5 9.5 0 1119 0z" />
              </svg>
              <span className="line-clamp-2">{address}</span>
            </div>

            {notes && (
              <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <span className="line-clamp-2">{notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {role === 'provider' && (canAccept || canComplete || canCancel) && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {canAccept && (
            <button
              onClick={() => onStatusChange(id, 'accepted')}
              className="btn-primary text-sm h-9 px-4"
            >
              Accept
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => onStatusChange(id, 'completed')}
              className="btn-secondary text-sm h-9 px-4"
            >
              Mark Complete
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onStatusChange(id, 'cancelled')}
              className="btn-danger text-sm h-9 px-4"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
