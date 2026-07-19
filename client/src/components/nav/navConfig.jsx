// One nav definition shared by the desktop top bar, the mobile tab bar and
// the dashboard sidebar.

const ico = {
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  'aria-hidden': 'true',
  className: 'w-6 h-6',
};

export const HomeIcon = () => (
  <svg {...ico}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...ico}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

export const CalendarIcon = () => (
  <svg {...ico}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
  </svg>
);

export const BriefcaseIcon = () => (
  <svg {...ico}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073a2.25 2.25 0 01-1.632 2.163l-1.32.377a12.06 12.06 0 01-6.196 0l-1.32-.377a2.25 2.25 0 01-1.632-2.163V14.15M20.25 14.15a2.25 2.25 0 00.659-1.591V9.75a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9.75v2.809c0 .638.271 1.204.659 1.591M20.25 14.15a2.25 2.25 0 01-.659.564l-6.955 3.478a2.25 2.25 0 01-2.012 0L3.67 14.714a2.25 2.25 0 01-.659-.564M15 5.25V4.5a2.25 2.25 0 00-2.25-2.25h-1.5A2.25 2.25 0 009 4.5v.75" />
  </svg>
);

export const UserIcon = () => (
  <svg {...ico}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

export const GridIcon = () => (
  <svg {...ico}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

export const ShieldIcon = () => (
  <svg {...ico}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

export const LoginIcon = () => (
  <svg {...ico}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
  </svg>
);

// Primary destinations, capped at four so the mobile tab bar stays scannable.
export function getNavItems(user) {
  if (!user) {
    return [
      { to: '/', label: 'Home', Icon: HomeIcon },
      { to: '/browse', label: 'Browse', Icon: SearchIcon },
      { to: '/jobs', label: 'Jobs', Icon: BriefcaseIcon },
      { to: '/login', label: 'Log in', Icon: LoginIcon },
    ];
  }

  if (user.role === 'admin') {
    return [
      { to: '/', label: 'Home', Icon: HomeIcon },
      { to: '/admin', label: 'Admin', Icon: GridIcon },
      { to: '/profile', label: 'Profile', Icon: UserIcon },
    ];
  }

  if (user.role === 'provider') {
    return [
      { to: '/', label: 'Home', Icon: HomeIcon },
      { to: '/jobs', label: 'Jobs', Icon: BriefcaseIcon },
      { to: '/dashboard/provider', label: 'Dashboard', Icon: GridIcon },
      { to: '/profile', label: 'Profile', Icon: UserIcon },
    ];
  }

  return [
    { to: '/', label: 'Home', Icon: HomeIcon },
    { to: '/browse', label: 'Browse', Icon: SearchIcon },
    { to: '/dashboard/customer', label: 'Bookings', Icon: CalendarIcon },
    { to: '/profile', label: 'Profile', Icon: UserIcon },
  ];
}

// Section nav for the dashboard sidebar on lg+.
export function getSidebarSections(user) {
  if (!user) return [];

  if (user.role === 'admin') {
    return [
      { id: 'analytics', label: 'Analytics', Icon: GridIcon },
      { id: 'providers', label: 'Providers', Icon: ShieldIcon },
      { id: 'categories', label: 'Categories', Icon: BriefcaseIcon },
      { id: 'users', label: 'Users', Icon: UserIcon },
    ];
  }

  if (user.role === 'provider') {
    return [
      { id: 'bookings', label: 'Jobs & bookings', Icon: CalendarIcon },
      { id: 'settings', label: 'Profile & verification', Icon: ShieldIcon },
    ];
  }

  return [
    { id: 'bookings', label: 'My bookings', Icon: CalendarIcon },
    { id: 'my_jobs', label: 'My job listings', Icon: BriefcaseIcon },
  ];
}

// Prefix match, so /providers/5 highlights Browse and /jobs/new highlights Jobs.
export function isRouteActive(pathname, to) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function BrandMark({ className = 'w-8 h-8', iconClass = 'w-5 h-5' }) {
  return (
    <div className={`${className} rounded-lg bg-brand flex items-center justify-center shrink-0`}>
      <svg className={`${iconClass} text-on-brand`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    </div>
  );
}
