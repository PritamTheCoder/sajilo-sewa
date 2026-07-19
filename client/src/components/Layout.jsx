import TopBar from './nav/TopBar';
import TabBar from './nav/TabBar';
import Footer from './Footer';

// App shell. Every page renders inside one of these.
//   < 1024px  bottom tab bar owns navigation; top bar is identity + utilities
//   >= 1024px top bar owns navigation, with an optional sidebar for dashboards

const WIDTHS = {
  app: 'max-w-[1200px]',
  form: 'max-w-2xl',
  reading: 'max-w-3xl',
  narrow: 'max-w-md',
  // Full-bleed pages manage their own gutters.
  full: 'max-w-none',
};

export default function Layout({
  children,
  title,
  width = 'app',
  sidebar = null,
  bare = false,
  padded = true,
  footer = true,
}) {
  // Auth screens render without shell chrome.
  if (bare) {
    return <div className="min-h-screen flex flex-col bg-bg">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <TopBar title={title} />

      <div
        className={`grow w-full ${WIDTHS[width]} mx-auto ${
          width === 'full' ? '' : 'px-4 sm:px-6 lg:px-8'
        }`}
      >
        <div className={sidebar ? 'lg:flex lg:gap-8' : ''}>
          {sidebar && (
            <aside className="hidden lg:block w-56 shrink-0 py-8" aria-label="Section navigation">
              <div className="sticky top-24">{sidebar}</div>
            </aside>
          )}

          <main className={`min-w-0 grow ${padded ? 'py-6 sm:py-8' : ''}`}>{children}</main>
        </div>
      </div>

      {footer && <Footer />}

      {/* Clears the fixed tab bar. */}
      <div className="lg:hidden h-[56px] pb-safe shrink-0" aria-hidden="true" />

      <TabBar />
    </div>
  );
}

// Vertical section nav for dashboard sidebars on lg+. The same items render as
// a horizontal tab strip below lg, driven by the same state.
export function SidebarNav({ sections, active, onChange }) {
  return (
    <nav className="space-y-1">
      {sections.map(({ id, label, Icon, count }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={isActive ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3 h-11 rounded-lg text-body-sm text-left
              transition-colors duration-fast ${
                isActive
                  ? 'bg-brand-subtle text-brand font-semibold'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text font-medium'
              }`}
          >
            <span className="shrink-0 [&>svg]:w-5 [&>svg]:h-5">
              <Icon />
            </span>
            <span className="grow truncate">{label}</span>
            {count > 0 && <span className="text-caption text-text-subtle tabular">{count}</span>}
          </button>
        );
      })}
    </nav>
  );
}
