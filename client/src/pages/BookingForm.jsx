import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getProviderById } from '../api/providers';
import { getCategories } from '../api/categories';
import { createBooking } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InlineError } from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import Layout from '../components/Layout';
import { formatDate } from '../utils/helpers';
import { avatarColor, avatarInitial } from '../utils/appearance';

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning', hint: '8 AM – 12 PM' },
  { value: 'afternoon', label: 'Afternoon', hint: '12 PM – 5 PM' },
  { value: 'evening', label: 'Evening', hint: '5 PM – 8 PM' },
];

const InfoIcon = (
  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

function StepIndicator({ step }) {
  return (
    <ol className="flex items-center gap-2 mb-6" aria-label={`Step ${step} of 2`}>
      {[1, 2].map((n) => (
        <li key={n} className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-bold tabular
              ${n <= step ? 'bg-brand text-on-brand' : 'bg-bg-subtle text-text-subtle'}`}
            aria-current={n === step ? 'step' : undefined}
          >
            {n}
          </span>
          <span className={`text-body-sm ${n === step ? 'text-text font-semibold' : 'text-text-subtle'}`}>
            {n === 1 ? 'Details' : 'Confirm'}
          </span>
          {n === 1 && <span className="w-6 h-px bg-border-strong ml-1" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <dt className="text-body-sm text-text-muted shrink-0">{label}</dt>
      <dd className="text-body-sm text-text font-medium text-right min-w-0">{value}</dd>
    </div>
  );
}

export default function BookingForm() {
  const { providerId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const selectedSlot = watch('time_slot');
  const selectedCategory = watch('category_id');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    Promise.all([getProviderById(providerId), getCategories()])
      .then(([p, cats]) => {
        setProvider(p);
        setCategories(cats);
      })
      .catch(() => addToast('Could not load booking data.', 'error'))
      .finally(() => setLoadingData(false));
    // addToast and navigate are stable for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, user]);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // The form is never unmounted, so going Back never loses what was typed.
  const goToConfirm = () => setStep(2);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      let finalCategoryId = data.category_id;
      let finalNotes = data.notes || '';

      if (data.category_id === 'other') {
        const otherCat = categories.find((c) => c.name.toLowerCase() === 'other');
        if (!otherCat) {
          // Refuse rather than silently filing under an arbitrary category.
          addToast(
            'This service type isn’t available for online booking yet. Please pick a listed category.',
            'error'
          );
          setStep(1);
          return;
        }
        finalCategoryId = otherCat.id;
        finalNotes = `Requested Service: ${data.custom_service}\n\n${finalNotes}`.trim();
      }

      await createBooking({
        provider_id: provider.user_id,
        category_id: parseInt(finalCategoryId, 10),
        scheduled_date: data.scheduled_date,
        time_slot: data.time_slot,
        address: data.address,
        notes: finalNotes || undefined,
      });
      addToast('Booking sent. The provider will confirm shortly.', 'success');
      navigate('/dashboard/customer');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
      addToast(msg || 'Booking failed. Please try again.', 'error');
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <Layout title="Book a service" width="form">
        <LoadingSpinner fullPage />
      </Layout>
    );
  }

  const providerName = provider?.user_name || 'Provider';
  const values = getValues();
  const categoryLabel =
    values.category_id === 'other'
      ? values.custom_service
      : categories.find((c) => String(c.id) === String(values.category_id))?.name;
  const slotLabel = TIME_SLOTS.find((s) => s.value === values.time_slot);

  return (
    <Layout title="Book a service" width="form">
      <div className="mb-6 animate-slide-up">
        <button
          onClick={() => (step === 2 ? setStep(1) : navigate(-1))}
          className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text mb-4 transition-colors duration-fast"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <h1 className="text-h1 text-text">Book a service</h1>
        <p className="text-body-sm text-text-muted mt-1">
          Booking with <span className="font-medium text-text">{providerName}</span>
        </p>
      </div>

      <StepIndicator step={step} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Step 1: details ── */}
        <div className={`card p-6 animate-slide-up ${step === 1 ? '' : 'hidden'}`}>
          <div className="space-y-6">
            <div>
              <label htmlFor="category_id" className="label">
                Service category <span className="text-danger">*</span>
              </label>
              <select
                id="category_id"
                aria-invalid={errors.category_id ? 'true' : undefined}
                className="input-field"
                {...register('category_id', { required: 'Please select a category' })}
              >
                <option value="">Select a service…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                <option value="other">Other (specify)</option>
              </select>
              <InlineError message={errors.category_id?.message} />
            </div>

            {selectedCategory === 'other' && (
              <div className="animate-fade-in">
                <label htmlFor="custom_service" className="label">
                  Specify service <span className="text-danger">*</span>
                </label>
                <input
                  id="custom_service"
                  type="text"
                  aria-invalid={errors.custom_service ? 'true' : undefined}
                  className="input-field"
                  placeholder="e.g. Furniture assembly"
                  {...register('custom_service', {
                    required: 'Please specify the service you need',
                  })}
                />
                <InlineError message={errors.custom_service?.message} />
              </div>
            )}

            <div>
              <label htmlFor="scheduled_date" className="label">
                Preferred date <span className="text-danger">*</span>
              </label>
              <input
                id="scheduled_date"
                type="date"
                min={getTodayStr()}
                aria-invalid={errors.scheduled_date ? 'true' : undefined}
                className="input-field"
                {...register('scheduled_date', { required: 'Please select a date' })}
              />
              <InlineError message={errors.scheduled_date?.message} />
            </div>

            <div>
              <span className="label">
                Time slot <span className="text-danger">*</span>
              </span>
              <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Select time slot">
                {TIME_SLOTS.map((slot) => (
                  <label
                    key={slot.value}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-center
                      min-h-[72px] transition-all duration-fast
                      focus-within:ring-2 focus-within:ring-ring/30 ${
                        selectedSlot === slot.value
                          ? 'border-brand bg-brand-subtle'
                          : 'border-border hover:border-border-strong'
                      }`}
                  >
                    <input
                      type="radio"
                      value={slot.value}
                      className="sr-only"
                      {...register('time_slot', { required: 'Please select a time slot' })}
                    />
                    <span
                      className={`text-body-sm font-semibold ${
                        selectedSlot === slot.value ? 'text-brand' : 'text-text'
                      }`}
                    >
                      {slot.label}
                    </span>
                    <span className="text-caption text-text-subtle mt-0.5">{slot.hint}</span>
                  </label>
                ))}
              </div>
              <InlineError message={errors.time_slot?.message} />
            </div>

            <div>
              <label htmlFor="address" className="label">
                Service address <span className="text-danger">*</span>
              </label>
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                aria-invalid={errors.address ? 'true' : undefined}
                className="input-field"
                placeholder="Thamel, Kathmandu"
                {...register('address', {
                  required: 'Address is required',
                  minLength: { value: 10, message: 'Address must be at least 10 characters' },
                })}
              />
              <InlineError message={errors.address?.message} />
              <span className="hint">Include a landmark so the provider can find you.</span>
            </div>

            <div>
              <label htmlFor="notes" className="label">Additional notes</label>
              <textarea
                id="notes"
                rows={3}
                className="input-field resize-none"
                placeholder="Describe the issue or any special instructions…"
                {...register('notes')}
              />
              <span className="hint">Optional — helps the provider prepare.</span>
            </div>

            <button
              type="button"
              onClick={handleSubmit(goToConfirm)}
              className="btn-primary btn-lg w-full"
            >
              Review booking
            </button>
          </div>
        </div>

        {/* ── Step 2: confirm ── */}
        {step === 2 && (
          <div className="animate-slide-up space-y-4">
            <div className="card p-6">
              <h2 className="text-h3 text-text mb-4">Check your booking</h2>

              <div className="flex items-center gap-3 pb-4 mb-2 border-b border-border">
                {provider?.profile_photo ? (
                  <img
                    src={provider.profile_photo}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${avatarColor(providerName)}`}
                    aria-hidden="true"
                  >
                    {avatarInitial(providerName)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-body font-semibold text-text truncate">{providerName}</p>
                  {provider?.identity_status === 'verified' && (
                    <span className="badge bg-success-subtle text-success mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 1.5l6.5 2.6v4.6c0 4-2.8 7.7-6.5 8.8-3.7-1.1-6.5-4.8-6.5-8.8V4.1L10 1.5zm3.2 6.2a1 1 0 00-1.4-1.4L9 9.1 8.2 8.3a1 1 0 10-1.4 1.4l1.5 1.5a1 1 0 001.4 0l3.5-3.5z" clipRule="evenodd" />
                      </svg>
                      ID verified
                    </span>
                  )}
                </div>
              </div>

              <dl>
                <SummaryRow label="Service" value={categoryLabel || '—'} />
                <SummaryRow label="Date" value={formatDate(values.scheduled_date)} />
                <SummaryRow
                  label="Time"
                  value={slotLabel ? `${slotLabel.label} · ${slotLabel.hint}` : '—'}
                />
                <SummaryRow label="Address" value={values.address} />
                {values.notes && <SummaryRow label="Notes" value={values.notes} />}
                <SummaryRow
                  label="Payment"
                  value={<span className="text-success">Pay on arrival</span>}
                />
              </dl>
            </div>

            <div className="callout-warning">
              {InfoIcon}
              <p>
                <strong>Details can&apos;t be edited after booking.</strong> Please check them
                now — you can cancel while the request is still pending, but once the provider
                accepts, this booking is locked in.
              </p>
            </div>

            <div className="callout-info">
              {InfoIcon}
              <p>
                <strong>No payment now.</strong> Settle directly with the provider after the
                service is done.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="btn-outline btn-lg sm:flex-1"
              >
                Back to details
              </button>
              <button type="submit" disabled={submitting} className="btn-primary btn-lg sm:flex-1">
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  'Confirm booking'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </Layout>
  );
}
