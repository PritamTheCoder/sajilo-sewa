// Each skeleton reserves the same space its real content will occupy, so
// loading never causes layout shift.

function Repeat({ count, children }) {
  return Array.from({ length: count }, (_, i) => <div key={i}>{children}</div>);
}

export function ProviderCardSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="flex items-start gap-4">
        <div className="skeleton-avatar w-16 h-16 shrink-0" />
        <div className="grow space-y-2 pt-1">
          <div className="skeleton-title w-3/4" />
          <div className="skeleton-text w-1/2 h-3" />
          <div className="skeleton-text w-2/3 h-3" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 grow">
          <div className="skeleton-title w-1/2" />
          <div className="skeleton-text w-1/3 h-3" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full shrink-0" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="skeleton-text w-2/5 h-3.5" />
        <div className="skeleton-text w-3/5 h-3.5" />
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <div className="grow space-y-2">
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton-title w-3/4" />
          <div className="skeleton-text w-1/3 h-3" />
        </div>
        <div className="skeleton-text w-16 h-4 shrink-0" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="skeleton-text w-full h-3" />
        <div className="skeleton-text w-4/5 h-3" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: columns }, (_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton-text" style={{ width: i === 0 ? '70%' : '50%' }} />
        </td>
      ))}
    </tr>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="card p-4 space-y-2" aria-hidden="true">
      <div className="skeleton-text w-1/2 h-3" />
      <div className="skeleton-title w-1/3" />
    </div>
  );
}

// Announces "loading" once instead of reading out every placeholder box.
export function SkeletonList({ count = 3, className = 'space-y-4', children }) {
  return (
    <div className={className} aria-busy="true" aria-live="polite" aria-label="Loading">
      <Repeat count={count}>{children}</Repeat>
    </div>
  );
}
