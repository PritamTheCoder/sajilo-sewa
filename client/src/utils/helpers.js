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
 * Map a booking status to Tailwind badge classes.
 * Uses the app's semantic palette (amber/sky/emerald/rose) so booking badges
 * stay consistent with the dashboard stat tiles and job-status chips.
 */
export function statusBadgeClass(status) {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-sky-100 text-sky-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
}
