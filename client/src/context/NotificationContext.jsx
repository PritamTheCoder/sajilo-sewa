import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30000;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stops a poll landing on top of a fresher list fetch.
  const inFlight = useRef(false);

  const refreshCount = useCallback(async () => {
    if (!user || inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count ?? 0);
    } catch {
      // A failed poll keeps the last known count until the next tick succeeds.
    } finally {
      inFlight.current = false;
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load your notifications.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markRead = useCallback(async (id) => {
    // Optimistic; rolls back on failure.
    const before = notifications;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch {
      setNotifications(before);
      setUnreadCount(before.filter((n) => !n.is_read).length);
    }
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    const before = notifications;
    const beforeCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(before);
      setUnreadCount(beforeCount);
    }
  }, [notifications, unreadCount]);

  // Polls the count endpoint only, never the full list, and pauses while the
  // tab is hidden to save battery and data.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    refreshCount();

    const tick = () => {
      if (document.visibilityState === 'visible') refreshCount();
    };

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [user, refreshCount]);

  // Navigation usually means the user acted on something.
  useEffect(() => {
    if (user) refreshCount();
  }, [location.pathname, user, refreshCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Default lets TabBar/TopBar render outside the provider without crashing.
export const useNotifications = () =>
  useContext(NotificationContext) || {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    fetchNotifications: () => {},
    markRead: () => {},
    markAllRead: () => {},
  };
