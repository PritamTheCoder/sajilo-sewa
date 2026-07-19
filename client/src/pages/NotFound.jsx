import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout width="narrow" title="Not found">
      <div className="text-center py-16">
        <p className="text-7xl font-black text-border-strong mb-2 tabular">404</p>
        <h1 className="text-h1 text-text mb-3">Page not found</h1>
        <p className="text-body text-text-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary">Go to home</Link>
          <Link to="/browse" className="btn-outline">Browse providers</Link>
        </div>
      </div>
    </Layout>
  );
}
