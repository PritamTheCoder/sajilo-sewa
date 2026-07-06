import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-7xl font-black text-slate-100 dark:text-slate-800 mb-2 tabular-nums">404</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Page not found</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary">Go to Home</Link>
          <Link to="/browse" className="btn-secondary">Browse Providers</Link>
        </div>
      </main>
    </>
  );
}
