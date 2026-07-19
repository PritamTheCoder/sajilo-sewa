import { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { avatarColor, avatarInitial } from '../utils/appearance';

// Scan order: photo, name + verification, rating with count, skill, price.
// This is the main trust surface, so price and verification stay above the
// fold of the card.
export default function ProviderCard({ provider }) {
  const name = provider.user_name || 'Provider';
  const rating = parseFloat(provider.average_rating) || 0;
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = provider.profile_photo && !imgFailed;

  return (
    <Link
      to={`/providers/${provider.id}`}
      className="relative flex flex-col card-hover p-5 rounded-2xl
        hover:-translate-y-0.5 transition-all duration-base ease-premium group
        overflow-hidden animate-fade-in"
      aria-label={`View profile of ${name}`}
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-slow" aria-hidden="true" />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="relative shrink-0">
          {showPhoto ? (
            <img
              src={provider.profile_photo}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              // Falls back to initials when the URL is present but broken.
              onError={() => setImgFailed(true)}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-bg-subtle
                group-hover:scale-105 transition-transform duration-base"
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-h3
                ring-4 ring-bg-subtle shrink-0 ${avatarColor(name)}`}
              aria-hidden="true"
            >
              {avatarInitial(name)}
            </div>
          )}

          {provider.is_approved && (
            <span className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5 shadow-sm">
              <span className="bg-success text-white rounded-full w-5 h-5 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="sr-only">Verified provider</span>
            </span>
          )}
        </div>

        {provider.hourly_rate && (
          <div className="inline-flex flex-col items-end shrink-0 bg-brand-subtle rounded-xl px-3 py-1.5">
            <span className="text-body-sm font-bold text-brand tabular">
              Rs. {Number(provider.hourly_rate).toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand/70">
              Per hour
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 relative z-10 grow flex flex-col">
        <h3 className="text-h3 text-text group-hover:text-brand transition-colors duration-fast line-clamp-1">
          {name}
        </h3>

        <div className="flex items-center gap-1.5 mt-1 text-body-sm text-text-muted">
          <svg className="w-4 h-4 text-text-subtle shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-9.5 11.25S.5 17.642.5 10.5a9.5 9.5 0 1119 0z" />
          </svg>
          <span className="truncate">
            {provider.city}{provider.area ? `, ${provider.area}` : ''}
          </span>
        </div>

        <div className="mt-2.5">
          {rating > 0 ? (
            <StarRating rating={rating} size="sm" showCount reviewCount={provider.review_count} />
          ) : (
            <span className="badge bg-bg-subtle text-text-muted">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              New provider
            </span>
          )}
        </div>

        {provider.bio && (
          <p className="mt-3.5 text-body-sm text-text-muted line-clamp-2 grow">{provider.bio}</p>
        )}

        {provider.trust_score > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="grow h-1.5 bg-bg-subtle rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full"
                style={{ width: `${provider.trust_score}%` }}
              />
            </div>
            <span className="text-caption font-semibold text-text-muted tabular shrink-0">
              Trust {provider.trust_score}/100
            </span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div className="flex flex-wrap gap-1.5 max-w-[70%]">
            {provider.services?.slice(0, 2).map((s) => (
              <span key={s} className="badge bg-bg-subtle text-text-muted">{s}</span>
            ))}
            {provider.services?.length > 2 && (
              <span className="badge bg-bg-subtle text-text-subtle">
                +{provider.services.length - 2}
              </span>
            )}
          </div>

          <span
            className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-subtle text-text-subtle
              group-hover:bg-brand-subtle group-hover:text-brand transition-colors duration-fast shrink-0"
            aria-hidden="true"
          >
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-fast" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
