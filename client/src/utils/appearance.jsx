// Single source of truth for status appearance and avatar colors.
// Every status carries an icon and a label alongside its color so meaning
// survives colorblindness, greyscale and screen readers.

// Inline so status chips never wait on a network request. aria-hidden because
// the adjacent label already carries the meaning.

const iconProps = {
  viewBox: '0 0 20 20',
  fill: 'currentColor',
  'aria-hidden': 'true',
  className: 'w-3.5 h-3.5 shrink-0',
};

const ClockIcon = () => (
  <svg {...iconProps}>
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L11 9.586V6z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg {...iconProps}>
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const XCircleIcon = () => (
  <svg {...iconProps}>
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
      clipRule="evenodd"
    />
  </svg>
);

const ArrowCircleIcon = () => (
  <svg {...iconProps}>
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const MinusCircleIcon = () => (
  <svg {...iconProps}>
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
      clipRule="evenodd"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg {...iconProps}>
    <path
      fillRule="evenodd"
      d="M10 1.5l6.5 2.6v4.6c0 4-2.8 7.7-6.5 8.8-3.7-1.1-6.5-4.8-6.5-8.8V4.1L10 1.5zm3.2 6.2a1 1 0 00-1.4-1.4L9 9.1 8.2 8.3a1 1 0 10-1.4 1.4l1.5 1.5a1 1 0 001.4 0l3.5-3.5z"
      clipRule="evenodd"
    />
  </svg>
);

const DotIcon = () => (
  <svg {...iconProps}>
    <circle cx="10" cy="10" r="4" />
  </svg>
);

// These resolve through CSS variables, so dark mode needs no `dark:` variant
// anywhere downstream.

const TONES = {
  success: { badge: 'bg-success-subtle text-success', solid: 'text-success', Icon: CheckCircleIcon },
  warning: { badge: 'bg-warning-subtle text-warning', solid: 'text-warning', Icon: ClockIcon },
  danger: { badge: 'bg-danger-subtle text-danger', solid: 'text-danger', Icon: XCircleIcon },
  info: { badge: 'bg-info-subtle text-info', solid: 'text-info', Icon: ArrowCircleIcon },
  neutral: { badge: 'bg-bg-subtle text-text-muted', solid: 'text-text-subtle', Icon: MinusCircleIcon },
};

const UNKNOWN = { label: 'Unknown', tone: 'neutral' };

// Labels are user-facing copy, never raw enum values.

const BOOKING = {
  pending: { label: 'Pending', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

const JOB = {
  open: { label: 'Open', tone: 'success' },
  awarded: { label: 'Awarded', tone: 'info' },
  closed: { label: 'Closed', tone: 'neutral' },
};

// The provider-facing and admin-facing APIs name this state differently.
const IDENTITY = {
  unverified: { label: 'Not submitted', tone: 'neutral' },
  not_submitted: { label: 'Not submitted', tone: 'neutral' },
  pending: { label: 'Under review', tone: 'warning' },
  verified: { label: 'Verified', tone: 'success', Icon: ShieldIcon },
  rejected: { label: 'Rejected', tone: 'danger' },
};

const VOUCH = {
  pending: { label: 'Awaiting reply', tone: 'warning' },
  vouched: { label: 'Vouched', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  expired: { label: 'Expired', tone: 'neutral' },
};

const APPROVAL = {
  pending: { label: 'Awaiting approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success', Icon: ShieldIcon },
  rejected: { label: 'Not approved', tone: 'danger' },
};

function resolve(registry, status) {
  const entry = registry[status] || UNKNOWN;
  const tone = TONES[entry.tone];
  return {
    label: entry.label,
    tone: entry.tone,
    // Compose onto `.badge`.
    badgeClass: tone.badge,
    textClass: tone.solid,
    Icon: entry.Icon || tone.Icon,
  };
}

export const bookingStatus = (status) => resolve(BOOKING, status);
export const jobStatus = (status) => resolve(JOB, status);
export const identityStatus = (status) => resolve(IDENTITY, status);
export const vouchStatus = (status) => resolve(VOUCH, status);
export const approvalStatus = (status) => resolve(APPROVAL, status);

// Prefer this over hand-assembling a badge, so the icon never gets dropped.
export function StatusBadge({ appearance, className = '' }) {
  const { badgeClass, Icon, label } = appearance;
  return (
    <span className={`badge ${badgeClass} ${className}`}>
      <Icon />
      {label}
    </span>
  );
}

// Decorative, so these stay literal rather than becoming semantic roles.

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
];

// Sums the whole string rather than the first character, so names sharing an
// initial don't all collapse onto the same color.
export function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function avatarInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || '?';
}

export { DotIcon, ShieldIcon, CheckCircleIcon, ClockIcon, XCircleIcon };
