import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProviders } from '../api/providers';
import { getCategories } from '../api/categories';
import ProviderCard from '../components/ProviderCard';
import ErrorMessage from '../components/ErrorMessage';
import Layout from '../components/Layout';
import { SkeletonList, ProviderCardSkeleton } from '../components/Skeletons';

const NEPAL_CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Butwal', 'Dharan', 'Hetauda'];

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];

const RATINGS = [
  { value: '', label: 'Any rating' },
  { value: '3', label: '3★ & up' },
  { value: '4', label: '4★ & up' },
  { value: '4.5', label: '4.5★ & up' },
];

// Filters that reset paging when they change.
const FILTER_KEYS = ['city', 'category_id', 'min_price', 'max_price', 'min_rating', 'sort'];

export default function Browse() {
  const [providers, setProviders] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriesFailed, setCategoriesFailed] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCity = searchParams.get('city') || '';
  const selectedCategory = searchParams.get('category_id') || '';
  const minRating = searchParams.get('min_rating') || '';
  const sort = searchParams.get('sort') || 'recommended';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const page = Number(searchParams.get('page')) || 1;

  // Price is free text, so the URL lags the inputs by a debounce.
  const [priceInputs, setPriceInputs] = useState({ min: minPrice, max: maxPrice });
  const debounceRef = useRef(null);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: pageSize, sort };
      if (selectedCity) params.city = selectedCity;
      if (selectedCategory) params.category_id = selectedCategory;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minRating) params.min_rating = minRating;

      const data = await getProviders(params);
      setProviders(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories()
      .then(setCategories)
      // Surfaced, so a failed fetch isn't mistaken for an empty category list.
      .catch(() => setCategoriesFailed(true));
  }, []);

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedCategory, minPrice, maxPrice, minRating, sort, page]);

  const setParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (FILTER_KEYS.includes(key)) next.delete('page');
      return next;
      // replace: typing a price shouldn't push one history entry per keystroke.
    }, { replace: true });
  };

  const onPriceChange = (bound, value) => {
    setPriceInputs((prev) => ({ ...prev, [bound]: value }));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam(bound === 'min' ? 'min_price' : 'max_price', value), 400);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const clearFilters = () => {
    setPriceInputs({ min: '', max: '' });
    setSearchParams({});
  };

  const hasFilters = selectedCity || selectedCategory || minPrice || maxPrice || minRating || sort !== 'recommended';

  return (
    <Layout title="Browse">
      <header className="mb-6">
        <h1 className="text-h1 text-text">Browse providers</h1>
        <p className="text-body-sm text-text-muted mt-1" aria-live="polite">
          {loading
            ? 'Finding providers…'
            : `${total} provider${total !== 1 ? 's' : ''} available`}
        </p>
      </header>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-8 p-4 card">
        <div className="flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span className="text-body-sm font-medium text-text">Filter</span>
        </div>

        {/* Full width on mobile so the selects don't wrap into a ragged row. */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 grow sm:grow-0">
          <div>
            <label htmlFor="city-filter" className="sr-only">Filter by city</label>
            <select
              id="city-filter"
              value={selectedCity}
              onChange={(e) => setParam('city', e.target.value)}
              className="input-field sm:w-40"
            >
              <option value="">All cities</option>
              {NEPAL_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="category-filter" className="sr-only">Filter by category</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setParam('category_id', e.target.value)}
              disabled={categoriesFailed}
              className="input-field sm:w-44"
            >
              <option value="">{categoriesFailed ? 'Categories unavailable' : 'All categories'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="min-price" className="sr-only">Minimum hourly rate</label>
            <input
              id="min-price"
              type="number"
              min="0"
              inputMode="numeric"
              value={priceInputs.min}
              onChange={(e) => onPriceChange('min', e.target.value)}
              placeholder="Min Rs."
              className="input-field sm:w-28"
            />
          </div>

          <div>
            <label htmlFor="max-price" className="sr-only">Maximum hourly rate</label>
            <input
              id="max-price"
              type="number"
              min="0"
              inputMode="numeric"
              value={priceInputs.max}
              onChange={(e) => onPriceChange('max', e.target.value)}
              placeholder="Max Rs."
              className="input-field sm:w-28"
            />
          </div>

          <div>
            <label htmlFor="rating-filter" className="sr-only">Minimum rating</label>
            <select
              id="rating-filter"
              value={minRating}
              onChange={(e) => setParam('min_rating', e.target.value)}
              className="input-field sm:w-36"
            >
              {RATINGS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="sort-by" className="sr-only">Sort by</label>
            <select
              id="sort-by"
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input-field sm:w-48"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost btn-sm self-start">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonList count={6} className={GRID}>
          <ProviderCardSkeleton />
        </SkeletonList>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchProviders} />
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-subtle flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </div>
          <h2 className="text-h3 text-text">No providers found</h2>
          <p className="text-body-sm text-text-muted mt-1">
            {hasFilters ? 'Try adjusting or clearing your filters.' : 'No approved providers yet.'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary mt-4">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className={GRID}>
            {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-between gap-3 mt-8" aria-label="Pagination">
              <button
                onClick={() => setParam('page', String(page - 1))}
                disabled={page <= 1}
                className="btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="text-body-sm text-text-muted tabular" aria-live="polite">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setParam('page', String(page + 1))}
                disabled={page >= totalPages}
                className="btn-secondary btn-sm"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </Layout>
  );
}
