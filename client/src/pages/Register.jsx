import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InlineError } from '../components/ErrorMessage';
import { linkWitnessAfterRegister } from '../api/witness';

export default function Register() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const witnessToken = searchParams.get('witness_token');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'customer' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        city: data.city || undefined,
        role: data.role,
      });
      login(res.access_token, null);
      addToast('Account created! Welcome to Sajilo Sewa.', 'success');
      // If this user registered to vouch for a provider, redirect to vouch page
      if (witnessToken) {
        try { await linkWitnessAfterRegister(witnessToken); } catch {}
        navigate(`/vouch/${witnessToken}`, { replace: true });
      } else {
        navigate('/');
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail[0]?.msg || 'Registration failed.'
        : detail || 'Registration failed. Please try again.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
          {witnessToken ? (
            <p className="text-brand-600 dark:text-brand-300 font-medium mt-1 text-sm">Create an account to vouch for a provider</p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Join Sajilo Sewa today — it's free</p>
          )}
        </div>

        <div className="card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {['customer', 'provider'].map((role) => (
                  <label
                    key={role}
                    className={`flex items-center justify-center gap-2 h-11 rounded-lg border-2 cursor-pointer text-sm font-medium transition-all ${
                      selectedRole === role
                        ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <input type="radio" value={role} {...register('role')} className="sr-only" />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="label">Full name <span className="text-red-500">*</span></label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="input-field"
                placeholder="Pritam Thapa"
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />
              <InlineError message={errors.name?.message} />
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Email address <span className="text-red-500">*</span></label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                })}
              />
              <InlineError message={errors.email?.message} />
            </div>

            <div>
              <label htmlFor="phone" className="label">Phone number</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                className="input-field"
                placeholder="98XXXXXXXX"
                {...register('phone')}
              />
            </div>

            <div>
              <label htmlFor="city" className="label">City</label>
              <input
                id="city"
                type="text"
                autoComplete="address-level2"
                className="input-field"
                placeholder="Kathmandu"
                {...register('city')}
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="label">Password <span className="text-red-500">*</span></label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                className="input-field"
                placeholder="Min. 8 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
              />
              <InlineError message={errors.password?.message} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full mt-2"
              id="register-submit"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 dark:text-brand-300 font-medium hover:text-brand-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
