import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from './Dialog';
import { useNotifications } from '../context/NotificationContext';
import { relativeTime } from '../utils/helpers';

const TYPE_ICONS = {
  booking_created: {
    tone: 'text-info bg-info-subtle',
    path: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5',
  },
  booking_accepted: {
    tone: 'text-success bg-success-subtle',
    path: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  booking_completed: {
    tone: 'text-success bg-success-subtle',
    path: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  booking_cancelled: {
    tone: 'text-danger bg-danger-subtle',
    path: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  review_received: {
    tone: 'text-warning bg-warning-subtle',
    path: 'M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  },
  identity_verified: {
    tone: 'text-success bg-success-subtle',
    path: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
  identity_rejected: {
    tone: 'text-danger bg-danger-subtle',
    path: 'M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285zm0 13.036h.008v.008H12v-.008z',
  },
  provider_approved: {
    tone: 'text-success bg-success-subtle',
    path: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
  job_application: {
    tone: 'text-info bg-info-subtle',
    path: 'M20.25 14.15v4.073a2.25 2.25 0 01-1.632 2.163l-1.32.377a12.06 12.06 0 01-6.196 0l-1.32-.377a2.25 2.25 0 01-1.632-2.163V14.15M15 5.25V4.5a2.25 2.25 0 00-2.25-2.25h-1.5A2.25 2.25 0 009 4.5v.75m11.25 8.9a2.25 2.25 0 00.659-1.591V9.75a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9.75v2.809c0 .638.271 1.204.659 1.591',
  },
  job_awarded: {
    tone: 'text-success bg-success-subtle',
    path: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.396 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
  },
};

const DEFAULT_ICON = {
  tone: 'text-text-muted bg-bg-subtle',
  path: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
};

function TypeIcon({ type }) {
  const { tone, path } = TYPE_ICONS[type] || DEFAULT_ICON;
  return (
    <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${tone}`}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 px-1 py-3">
      <div className="skeleton-avatar w-9 h-9 shrink-0" />
      <div className="grow space-y-2 pt-1">
        <div className="skeleton-text w-2/3" />
        <div className="skeleton-text w-full h-3" />
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  const handleOpen = () => {
    setOpen(true);
    fetchNotifications();
  };

  const handleRowClick = (n) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex items-center justify-center w-11 h-11 rounded-lg text-text-muted
          hover:bg-surface-hover hover:text-text transition-colors duration-fast"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications, none unread'
        }
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d={DEFAULT_ICON.path} />
        </svg>
        {unreadCount > 0 && (
          // A count rather than a bare dot, so state isn't conveyed by color alone.
          <span
            className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full
              bg-danger text-white text-[10px] font-bold leading-[18px] text-center tabular"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Announces count changes that happen while focus is elsewhere. */}
      <span className="sr-only" aria-live="polite">
        {unreadCount > 0 ? `${unreadCount} unread notifications` : ''}
      </span>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
        size="md"
        footer={
          notifications.length > 0 && unreadCount > 0 ? (
            <button type="button" onClick={markAllRead} className="btn-ghost btn-sm w-full sm:w-auto">
              Mark all as read
            </button>
          ) : null
        }
      >
        {loading && notifications.length === 0 && (
          <div className="divide-y divide-border" aria-busy="true">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-8">
            <p className="text-body-sm text-text-muted">{error}</p>
            <button type="button" onClick={fetchNotifications} className="btn-secondary btn-sm mt-3">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto rounded-full bg-bg-subtle flex items-center justify-center">
              <svg className="w-6 h-6 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-body font-semibold text-text mt-3">You’re all caught up</h3>
            <p className="text-body-sm text-text-muted mt-1">
              Updates about your bookings and reviews will show up here.
            </p>
          </div>
        )}

        {notifications.length > 0 && (
          <ul className="divide-y divide-border -mx-1">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleRowClick(n)}
                  className="w-full flex gap-3 px-1 py-3 text-left rounded-lg
                    hover:bg-surface-hover transition-colors duration-fast"
                >
                  <TypeIcon type={n.type} />
                  <div className="min-w-0 grow">
                    <div className="flex items-start gap-2">
                      <p className={`text-body-sm min-w-0 ${n.is_read ? 'text-text-muted' : 'text-text font-semibold'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-brand" aria-label="Unread" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-body-sm text-text-muted mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-caption text-text-subtle mt-1">{relativeTime(n.created_at)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}
