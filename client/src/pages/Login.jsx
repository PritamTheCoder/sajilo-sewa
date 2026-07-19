import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InlineError } from '../components/ErrorMessage';
import Layout from '../components/Layout';
import { BrandMark } from '../components/nav/navConfig';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // WitnessVouch links here with ?redirect=/vouch/:token so an invited user
  // lands back on the invitation after signing in.
  const redirectTo = params.get('redirect') || '/';

  const onSubmit = async (data) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await loginApi(data);
      await login(res.access_token);
      addToast('Welcome back.', 'success');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // Inline, next to the form, rather than in a corner toast.
      setFormError(err?.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout bare>
      <main className="grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-3" aria-label="Sajilo Sewa home">
              <BrandMark className="w-12 h-12 rounded-2xl" iconClass="w-7 h-7" />
            </Link>
            <h1 className="text-h1 text-text mt-4">Welcome back</h1>
            <p className="text-body-sm text-text-muted mt-1">
              Sign in to your Sajilo Sewa account
            </p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {formError && (
                <div className="callout-danger" role="alert">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <p>{formError}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={errors.email ? 'true' : undefined}
                  className="input-field"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email',
                    },
                  })}
                />
                <InlineError message={errors.email?.message} />
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : undefined}
                  className="input-field"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <InlineError message={errors.password?.message} />
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-body-sm text-text-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link
              to={`/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-brand font-medium hover:text-brand-hover transition-colors duration-fast"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </main>
    </Layout>
  );
}
