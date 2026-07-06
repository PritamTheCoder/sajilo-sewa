import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getCategories } from '../api/categories';
import { getPlatformStats } from '../api/statistics';

const CATEGORY_ICONS = {
  plumbing: '🔧', electrical: '⚡', cleaning: '🧹', tutoring: '📚',
  painting: '🎨', carpentry: '🔨', ac: '❄️', gardening: '🌿',
  shifting: '📦', pest: '🐛', laundry: '👕', cooking: '🍳',
};

const NEPAL_CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Butwal', 'Dharan', 'Hetauda'];

const HOW_IT_WORKS = [
  { step: '01', title: 'Browse Providers', desc: 'Search by service type and city to find trusted local professionals near you.' },
  { step: '02', title: 'Book a Service', desc: 'Choose your preferred date, time slot, and provide your service address.' },
  { step: '03', title: 'Pay on Arrival', desc: 'No upfront payment. Settle directly with the provider after the service is done.' },
];

function ServiceIcon({ icon, label }) {
  return (
    <Link
      to="/browse"
      aria-label={`Browse ${label} providers`}
      className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-500/50 hover:shadow-md transition-all duration-200 group"
    >
      <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-2xl group-hover:bg-brand-100 dark:group-hover:bg-brand-500/20 transition-colors">
        <span aria-hidden="true">{icon}</span>
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
    </Link>
  );
}

function StatBlock({ value, label }) {
  return (
    <div>
      <div className="text-2xl font-bold text-brand-700 dark:text-brand-300 tabular-nums">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sajilo Sewa</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} Sajilo Sewa. Built by Pritam, Mahesh &amp; Sujan.</p>
      </div>
    </footer>
  );
}

/* ─── Logged-in: personalized, role-aware home ─────────────────────────────── */

function QuickAction({ to, title, desc, icon, accent }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

const ICON = {
  browse: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  calendar: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  user: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  briefcase: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>,
  shield: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>,
};

const ROLE_ACTIONS = {
  customer: [
    { to: '/browse', title: 'Find a Provider', desc: 'Browse verified professionals near you.', icon: ICON.browse, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300' },
    { to: '/dashboard/customer', title: 'My Bookings', desc: 'Track and manage your service bookings.', icon: ICON.calendar, accent: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
    { to: '/jobs/new', title: 'Post a Job', desc: 'Describe a job and let providers apply.', icon: ICON.plus, accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
    { to: '/profile', title: 'My Profile', desc: 'Update your account details.', icon: ICON.user, accent: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  ],
  provider: [
    { to: '/jobs', title: 'Find Jobs', desc: 'Browse open jobs and send applications.', icon: ICON.briefcase, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300' },
    { to: '/dashboard/provider', title: 'My Dashboard', desc: 'Manage bookings, profile and verification.', icon: ICON.calendar, accent: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
    { to: '/profile', title: 'My Profile', desc: 'Update your account details.', icon: ICON.user, accent: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  ],
  admin: [
    { to: '/admin', title: 'Admin Panel', desc: 'Approve providers and manage the platform.', icon: ICON.shield, accent: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300' },
    { to: '/browse', title: 'Browse Providers', desc: 'See the live provider directory.', icon: ICON.browse, accent: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  ],
};

const ROLE_SUBTITLE = {
  customer: 'Ready to get something fixed? Find a trusted professional or check on your bookings.',
  provider: 'Here’s your workspace — find new jobs and stay on top of your bookings.',
  admin: 'Manage providers, categories and platform activity from here.',
};

function LoggedInHome({ user, categories }) {
  const firstName = user.name?.split(' ')[0] || 'there';
  const actions = ROLE_ACTIONS[user.role] || ROLE_ACTIONS.customer;

  return (
    <main>
      {/* Personalized hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="animate-slide-up">
            <p className="text-indigo-200 text-sm font-medium">Welcome back</p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">
              Namaste, {firstName} 👋
            </h1>
            <p className="mt-3 text-indigo-100 max-w-xl leading-relaxed">
              {ROLE_SUBTITLE[user.role] || ROLE_SUBTITLE.customer}
            </p>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((a) => <QuickAction key={a.to} {...a} />)}
        </div>
      </section>

      {/* Popular services — customers only */}
      {user.role === 'customer' && categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Popular services</h2>
            <Link to="/browse" className="text-sm font-medium text-brand-600 dark:text-brand-300 hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.slice(0, 6).map((c) => (
              <ServiceIcon key={c.slug} label={c.name} icon={CATEGORY_ICONS[c.slug] || '🛠️'} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

/* ─── Logged-out: marketing landing with integrated search ─────────────────── */

function LoggedOutHome({ categories, stats }) {
  const navigate = useNavigate();
  const [searchCategory, setSearchCategory] = useState('');
  const [searchCity, setSearchCity] = useState('');

  const displayCategories = categories.length > 0
    ? categories.slice(0, 6)
    : ['plumbing', 'electrical', 'cleaning', 'tutoring', 'painting', 'carpentry']
        .map((slug) => ({ slug, name: slug[0].toUpperCase() + slug.slice(1) }));

  const displayStats = stats
    ? [
        { value: `${stats.verified_providers}+`, label: 'Verified Providers' },
        { value: `${stats.bookings_completed}+`, label: 'Bookings Completed' },
        { value: stats.average_rating > 0 ? `${stats.average_rating}★` : '—', label: 'Average Rating' },
        { value: `${stats.active_categories}+`, label: 'Service Categories' },
      ]
    : [
        { value: '—', label: 'Verified Providers' },
        { value: '—', label: 'Bookings Completed' },
        { value: '—', label: 'Average Rating' },
        { value: '—', label: 'Service Categories' },
      ];

  const onSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCategory) params.set('category_id', searchCategory);
    if (searchCity) params.set('city', searchCity);
    navigate(`/browse${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.05%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              Trusted services across Nepal
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Local services,<br />
              <span className="text-indigo-200">made simple.</span>
            </h1>
            <p className="mt-5 text-lg text-indigo-100 leading-relaxed max-w-xl">
              Sajilo Sewa connects you with verified local professionals for plumbing, cleaning, tutoring and more — book in minutes, pay on arrival.
            </p>

            {/* Integrated search */}
            <form onSubmit={onSearch} className="mt-8 bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-xl flex flex-col sm:flex-row gap-2">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                aria-label="Service type"
                className="flex-1 h-12 px-4 rounded-xl text-sm bg-transparent text-slate-900 dark:text-slate-100 border-0 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
              >
                <option value="">What do you need?</option>
                {displayCategories.map((c) => (
                  c.id ? <option key={c.id} value={c.id}>{c.name}</option> : <option key={c.slug} value="">{c.name}</option>
                ))}
              </select>
              <div className="hidden sm:block w-px bg-slate-200 dark:bg-slate-700 my-2" />
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                aria-label="City"
                className="flex-1 h-12 px-4 rounded-xl text-sm bg-transparent text-slate-900 dark:text-slate-100 border-0 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
              >
                <option value="">Where?</option>
                {NEPAL_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="btn-primary h-12 px-6 shrink-0">
                Search
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            </form>

            <div className="mt-5">
              <Link to="/register" className="text-sm font-medium text-indigo-100 hover:text-white inline-flex items-center gap-1.5">
                Want to offer your services? Become a provider
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <section className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800" aria-label="Platform statistics">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {displayStats.map((s) => <StatBlock key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16" aria-labelledby="services-heading">
        <div className="text-center mb-10">
          <h2 id="services-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Popular Services</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Find the right professional for any job around your home or office.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {displayCategories.map((c) => (
            <ServiceIcon key={c.slug} label={c.name} icon={CATEGORY_ICONS[c.slug] || '🛠️'} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/browse" className="btn-secondary">
            View all services
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800 py-16" aria-labelledby="how-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">How It Works</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Book a service in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center" aria-labelledby="cta-heading">
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl p-10 text-white shadow-xl">
          <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-indigo-200 mb-8 text-base">Join customers and providers already using Sajilo Sewa across Nepal.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-primary bg-white text-brand-700 hover:bg-indigo-50 h-12 px-6 text-base shadow">
              Create Free Account
            </Link>
            <Link to="/browse" className="btn-ghost text-white hover:bg-white/20 h-12 px-6 text-base border border-white/30">
              Browse Providers
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getCategories().then((data) => setCategories(data.filter((c) => c.is_active))).catch(() => {});
    getPlatformStats().then(setStats).catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      {user
        ? <LoggedInHome user={user} categories={categories} />
        : <LoggedOutHome categories={categories} stats={stats} />}
    </>
  );
}
