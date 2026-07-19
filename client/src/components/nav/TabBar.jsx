import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getNavItems, isRouteActive } from './navConfig';

// Bottom tab bar for mobile and tablet. Visible up to lg, where the desktop
// sidebar takes over.
export default function TabBar() {
  const { user } = useAuth();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const items = getNavItems(user);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-tabbar bg-surface/95 backdrop-blur-lg
        border-t border-border pb-safe"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around">
        {items.map(({ to, label, Icon }) => {
          const active = isRouteActive(location.pathname, to);
          // Profile carries the unread badge; there is no room for a fifth tab.
          const badge = to === '/profile' ? unreadCount : 0;

          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5
                  min-h-[56px] px-1 py-1.5 transition-colors duration-fast
                  ${active ? 'text-brand' : 'text-text-subtle hover:text-text-muted'}`}
              >
                <span className="relative">
                  <Icon />
                  {badge > 0 && (
                    <span
                      className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full
                        bg-danger text-white text-[10px] font-bold leading-[18px] text-center tabular"
                    >
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                {/* Weight changes with color so the active state is never color alone. */}
                <span className={`text-[11px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
