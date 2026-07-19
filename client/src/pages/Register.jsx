import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InlineError } from '../components/ErrorMessage';
import Layout from '../components/Layout';
import { BrandMark } from '../components/nav/navConfig';
import { linkWitnessAfterRegister } from '../api/witness';

const ROLES = [
  { value: 'customer', label: 'Customer', hint: 'I need a service' },
  { value: 'provider', label: 'Provider', hint: 'I offer a service' },
];

export default function Register() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const witnessToken = searchParams.get('witness_token');
  const redirectTo = searchParams.get('redirect') || '/';
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'customer' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        city: data.city || undefined,
        role: data.role,
      });
      await login(res.access_token);
      addToast('Account created. Welcome to Sajilo Sewa.', 'success');

      if (witnessToken) {
        try {
          await linkWitnessAfterRegister(witnessToken);
        } catch {
          // Non-fatal: the vouch page resolves the token itself.
        }
        navigate(`/vouch/${witnessToken}`, { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setFormError(
        Array.isArray(detail)
          ? detail[0]?.msg || 'Registration failed.'
          : detail || 'Registration failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout bare>
      <main className="grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex" aria-label="Sajilo Sewa home">
              <BrandMark className="w-12 h-12 rounded-2xl" iconClass="w-7 h-7" />
            </Link>
            <h1 className="text-h1 text-text mt-4">Create account</h1>
            {witnessToken ? (
              <p className="text-body-sm text-brand font-medium mt-1">
                Create an account to vouch for a provider
              </p>
            ) : (
              <p className="text-body-sm text-text-muted mt-1">
                Join Sajilo Sewa today — it&apos;s free
              </p>
            )}
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

              {/* focus-within gives the sr-only radios a visible focus ring. */}
              <fieldset>
                <legend className="label">I am a</legend>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
                  {ROLES.map(({ value, label, hint }) => (
                    <label
                      key={value}
                      className={`flex flex-col items-center justify-center gap-0.5 min-h-[60px] px-2 py-2
                        rounded-lg border-2 cursor-pointer text-center transition-all duration-fast
                        focus-within:ring-2 focus-within:ring-ring/30 ${
                          selectedRole === value
                            ? 'border-brand bg-brand-subtle'
                            : 'border-border hover:border-border-strong'
                        }`}
                    >
                      <input type="radio" value={value} {...register('role')} className="sr-only" />
                      <span
                        className={`text-body-sm font-semibold ${
                          selectedRole === value ? 'text-brand' : 'text-text'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="text-caption text-text-subtle">{hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="name" className="label">
                  Full name <span className="text-danger">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={errors.name ? 'true' : undefined}
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
                <label htmlFor="reg-email" className="label">
                  Email address <span className="text-danger">*</span>
                </label>
                <input
                  id="reg-email"
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
                <label htmlFor="reg-password" className="label">
                  Password <span className="text-danger">*</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={errors.password ? 'true' : undefined}
                  className="input-field"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                />
                {/* Requirements shown up front, not only after a failure. */}
                {errors.password ? (
                  <InlineError message={errors.password.message} />
                ) : (
                  <span className="hint">At least 8 characters.</span>
                )}
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-body-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link
              to={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-brand font-medium hover:text-brand-hover transition-colors duration-fast"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </Layout>
  );
}
