const Star = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Shows the number and the count; a bare star row reads as fake.
export default function StarRating({ rating, size = 'md', showCount, reviewCount }) {
  const filled = Math.round(rating || 0);
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={
        reviewCount != null
          ? `Rated ${Number(rating ?? 0).toFixed(1)} out of 5 from ${reviewCount} reviews`
          : `Rated ${Number(rating ?? 0).toFixed(1)} out of 5`
      }
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            // Empty stars were text-slate-200 — invisible on a dark card.
            className={`${sizeClass} ${star <= filled ? 'text-amber-400' : 'text-border-strong'}`}
          />
        ))}
      </div>
      {rating != null && (
        <span className="text-body-sm font-semibold text-text tabular">
          {Number(rating).toFixed(1)}
        </span>
      )}
      {showCount && reviewCount != null && (
        <span className="text-body-sm text-text-subtle tabular">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

export function StarRatingInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          onClick={() => onChange(star)}
          // 44px hit area; the star itself stays visually 24px.
          className={`w-11 h-11 flex items-center justify-center rounded-lg
            transition-transform duration-fast hover:scale-110 active:scale-95 ${
              star <= value ? 'text-amber-400' : 'text-border-strong hover:text-amber-200'
            }`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star className="w-6 h-6" />
        </button>
      ))}
    </div>
  );
}
