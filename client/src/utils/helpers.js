/**
 * Format a date string for display in booking cards.
 * @param {string} dateStr - ISO date string (e.g. "2026-05-20")
 * @returns {string} - Human-readable date (e.g. "20 May 2026")
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Capitalise the first letter of a string.
 * Used for displaying status badges (pending → Pending).
 */
export function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Compact relative time. Falls back to an absolute date past a week, where
 * "23 days ago" is harder to read than the date itself.
 */
export function relativeTime(dateStr) {
  if (!dateStr) return '';
  const then = new Date(dateStr);
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}
