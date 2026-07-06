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
import Navbar from '../components/Navbar';

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning', hint: '8 AM – 12 PM' },
  { value: 'afternoon', label: 'Afternoon', hint: '12 PM – 5 PM' },
  { value: 'evening', label: 'Evening', hint: '5 PM – 8 PM' },
];

export default function BookingForm() {
  const { providerId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const selectedSlot = watch('time_slot');
  const selectedCategory = watch('category_id');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([getProviderById(providerId), getCategories()])
      .then(([p, cats]) => { setProvider(p); setCategories(cats); })
      .catch(() => addToast('Could not load booking data.', 'error'))
      .finally(() => setLoadingData(false));
  }, [providerId, user]);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      let finalCategoryId = data.category_id;
      let finalNotes = data.notes || '';

      if (data.category_id === 'other') {
        const otherCat = categories.find(c => c.name.toLowerCase() === 'other');
        finalCategoryId = otherCat ? otherCat.id : categories[0]?.id; // Fallback to first if no "Other" category exists
        finalNotes = `Requested Service: ${data.custom_service}\n\n${finalNotes}`.trim();
      }

      await createBooking({
        provider_id: provider.user_id,
        category_id: parseInt(finalCategoryId),
        scheduled_date: data.scheduled_date,
        time_slot: data.time_slot,
        address: data.address,
        notes: finalNotes || undefined,
      });
      addToast('Booking submitted! The provider will confirm shortly.', 'success');
      navigate('/dashboard/customer');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
      addToast(msg || 'Booking failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) return <><Navbar /><LoadingSpinner fullPage /></>;

  const providerName = provider?.user_name || 'Provider';

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 animate-slide-up">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Book a Service</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Booking with <span className="font-medium text-slate-700 dark:text-slate-200">{providerName}</span></p>
        </div>

        <div className="card p-6 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            {/* Category */}
            <div>
              <label htmlFor="category_id" className="label">Service category <span className="text-red-500">*</span></label>
              <select
                id="category_id"
                className="input-field"
                {...register('category_id', { required: 'Please select a category' })}
              >
                <option value="">Select a service…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                <option value="other">Other (Specify)</option>
              </select>
              <InlineError message={errors.category_id?.message} />
            </div>

            {selectedCategory === 'other' && (
              <div className="animate-fade-in">
                <label htmlFor="custom_service" className="label">Specify Service <span className="text-red-500">*</span></label>
                <input
                  id="custom_service"
                  type="text"
                  className="input-field"
                  placeholder="E.g., Furniture Assembly"
                  {...register('custom_service', { required: 'Please specify the service you need' })}
                />
                <InlineError message={errors.custom_service?.message} />
              </div>
            )}

            {/* Date */}
            <div>
              <label htmlFor="scheduled_date" className="label">Preferred date <span className="text-red-500">*</span></label>
              <input
                id="scheduled_date"
                type="date"
                min={getTodayStr()}
                className="input-field"
                {...register('scheduled_date', { required: 'Please select a date' })}
              />
              <InlineError message={errors.scheduled_date?.message} />
            </div>

            {/* Time slot */}
            <div>
              <label className="label">Time slot <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Select time slot">
                {TIME_SLOTS.map((slot) => (
                  <label
                    key={slot.value}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                      selectedSlot === slot.value
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-500/15'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      value={slot.value}
                      className="sr-only"
                      {...register('time_slot', { required: 'Please select a time slot' })}
                    />
                    <span className={`text-sm font-semibold ${selectedSlot === slot.value ? 'text-brand-700 dark:text-brand-200' : 'text-slate-700 dark:text-slate-300'}`}>
                      {slot.label}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{slot.hint}</span>
                  </label>
                ))}
              </div>
              <InlineError message={errors.time_slot?.message} />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="label">Service address <span className="text-red-500">*</span></label>
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                className="input-field"
                placeholder="Thamel, Kathmandu (min. 10 characters)"
                {...register('address', {
                  required: 'Address is required',
                  minLength: { value: 10, message: 'Address must be at least 10 characters' },
                })}
              />
              <InlineError message={errors.address?.message} />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="label">Additional notes</label>
              <textarea
                id="notes"
                rows={3}
                className="input-field h-auto py-2.5 resize-none"
                placeholder="Describe the issue or any special instructions…"
                {...register('notes')}
              />
              <p className="text-xs text-slate-400 mt-1">Optional — helps the provider prepare</p>
            </div>

            {/* Info notice */}
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-sm text-amber-700">
                <strong>Pay on arrival.</strong> No payment is needed now. Settle directly with the provider after the service.
              </p>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full" id="booking-submit">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Submitting…
                </span>
              ) : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
