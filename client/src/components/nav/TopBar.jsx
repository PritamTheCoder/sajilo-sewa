import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getNavItems, isRouteActive, BrandMark } from './navConfig';
import NotificationBell from '../NotificationBell';
import { avatarColor, avatarInitial } from '../../utils/appearance';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-11 h-11 rounded-lg text-text-muted
        hover:bg-surface-hover hover:text-text transition-colors duration-fast"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}

// On mobile this is identity and utilities only (the tab bar owns navigation);
// on desktop it is the primary nav.
export default function TopBar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = getNavItems(user);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-nav bg-surface/80 backdrop-blur-lg border-b border-border">
      <nav className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Sajilo Sewa home">
              <BrandMark />
              <span className={`text-body-lg font-bold text-text ${title ? 'hidden lg:inline' : ''}`}>
                Sajilo Sewa
              </span>
            </Link>
            {title && (
              <h1 className="lg:hidden text-body-lg font-semibold text-text truncate">{title}</h1>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {navItems
              .filter((item) => item.to !== '/profile' && item.to !== '/login')
              .map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isRouteActive(location.pathname, item.to) ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-body-sm font-medium transition-colors duration-fast ${
                    isRouteActive(location.pathname, item.to)
                      ? 'text-brand bg-brand-subtle'
                      : 'text-text-muted hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {user && <NotificationBell />}
            <ThemeToggle />

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="hidden lg:flex items-center gap-2 ml-1 pl-2 rounded-lg hover:bg-surface-hover
                    h-11 pr-3 transition-colors duration-fast"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-caption ${avatarColor(user.name)}`}
                    aria-hidden="true"
                  >
                    {avatarInitial(user.name)}
                  </div>
                  <span className="text-body-sm font-medium text-text">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="hidden lg:inline-flex btn-ghost btn-sm">
                  Log out
                </button>
              </>
            ) : (
              <div className="hidden lg:flex items-center gap-2 ml-1">
                <Link to="/login" className="btn-ghost btn-sm">Log in</Link>
                <Link to="/register" className="btn-primary btn-sm">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
