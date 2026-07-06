const STYLES = {
  positive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  negative: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const LABELS = { positive: 'Positive', neutral: 'Neutral', negative: 'Negative' };

export default function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  const { label } = sentiment;
  return <span className={`badge ${STYLES[label] || STYLES.neutral}`}>{LABELS[label] || 'Neutral'}</span>;
}
