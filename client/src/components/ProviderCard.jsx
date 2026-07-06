import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700 ring-violet-50',
  'bg-emerald-100 text-emerald-700 ring-emerald-50',
  'bg-amber-100 text-amber-700 ring-amber-50',
  'bg-sky-100 text-sky-700 ring-sky-50',
  'bg-rose-100 text-rose-700 ring-rose-50',
];

function AvatarFallback({ name }) {
  const colorClass = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ring-4 shadow-inner shrink-0 ${colorClass}`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

export default function ProviderCard({ provider }) {
  const name = provider.user_name || 'Provider';
  const rating = parseFloat(provider.average_rating) || 0;

  return (
    <Link
      to={`/providers/${provider.id}`}
      className="relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300 group overflow-hidden animate-fade-in"
      aria-label={`View profile of ${name}`}
    >
      {/* Decorative gradient blur in background on hover */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Top Header Section */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="relative shrink-0">
          {provider.profile_photo ? (
            <img
              src={provider.profile_photo}
              alt={name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-50 dark:ring-slate-800 shadow-sm group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <AvatarFallback name={name} />
          )}
          {/* Verified Badge — only shown for actually approved providers */}
          {provider.is_approved && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" title="Verified Provider">
              <div className="bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Badge */}
        {provider.hourly_rate && (
          <div className="inline-flex flex-col items-end shrink-0 bg-brand-50/50 rounded-xl px-3 py-1.5 border border-brand-100/50">
            <span className="text-sm font-bold text-brand-700 tabular-nums">
              Rs. {Number(provider.hourly_rate).toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600/70">
              Per Hour
            </span>
          </div>
        )}
      </div>

      {/* Profile Details */}
      <div className="mt-4 relative z-10 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors line-clamp-1">
          {name}
        </h3>

        <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500 dark:text-slate-400">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9.5 9.5 0 1119 0z" />
          </svg>
          <span className="truncate">{provider.city}{provider.area ? `, ${provider.area}` : ''}</span>
        </div>

        <div className="mt-2.5">
          {rating > 0 ? (
            <StarRating rating={rating} size="sm" showCount reviewCount={provider.review_count} />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              New Provider
            </span>
          )}
        </div>

        {/* Bio */}
        {provider.bio && (
          <p className="mt-3.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed flex-1">
            {provider.bio}
          </p>
        )}

        {/* Trust score */}
        {provider.trust_score > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-400 to-emerald-500 rounded-full transition-all"
                style={{ width: `${provider.trust_score}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 tabular-nums shrink-0">
              Trust {provider.trust_score}/100
            </span>
          </div>
        )}

        {/* Services & Action */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex flex-wrap gap-1.5 max-w-[70%]">
            {provider.services?.slice(0, 2).map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shadow-sm">
                {s}
              </span>
            ))}
            {provider.services?.length > 2 && (
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                +{provider.services.length - 2}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/20 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors shrink-0">
            <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
