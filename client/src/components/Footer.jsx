import { Link } from 'react-router-dom';
import { BrandMark } from './nav/navConfig';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-8 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2" aria-label="Sajilo Sewa home">
          <BrandMark className="w-7 h-7" iconClass="w-4 h-4" />
          <span className="text-body-sm font-semibold text-text">Sajilo Sewa</span>
        </Link>

        <nav className="flex items-center gap-5" aria-label="Footer">
          <Link to="/browse" className="text-body-sm text-text-muted hover:text-text transition-colors duration-fast">
            Browse
          </Link>
          <Link to="/jobs" className="text-body-sm text-text-muted hover:text-text transition-colors duration-fast">
            Jobs
          </Link>
        </nav>

        <p className="text-caption text-text-subtle text-center sm:text-right">
          © {new Date().getFullYear()} Sajilo Sewa. Built by Pritam, Mahesh &amp; Sujan.
        </p>
      </div>
    </footer>
  );
}
