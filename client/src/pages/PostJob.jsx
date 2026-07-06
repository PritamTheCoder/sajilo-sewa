import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createJobListing } from '../api/jobs';
import { getCategories } from '../api/categories';
import { useToast } from '../context/ToastContext';
import { InlineError } from '../components/ErrorMessage';
import Navbar from '../components/Navbar';

export default function PostJob() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    getCategories().then((c) => setCategories(c.filter((x) => x.is_active))).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        city: data.city,
        area: data.area || undefined,
        category_id: data.category_id ? parseInt(data.category_id) : undefined,
        scheduled_date: data.scheduled_date || undefined,
        time_slot: data.time_slot || undefined,
        budget_min: data.budget_min ? parseFloat(data.budget_min) : undefined,
        budget_max: data.budget_max ? parseFloat(data.budget_max) : undefined,
      };
      await createJobListing(payload);
      addToast('Job listing posted! Providers can now apply.', 'success');
      navigate('/jobs');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail || 'Could not post listing.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Post a Job</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Describe what you need — verified providers will apply directly.</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Job Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Fix leaking kitchen pipe"
                {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'At least 5 characters' } })}
              />
              <InlineError message={errors.title?.message} />
            </div>

            <div>
              <label className="label">Description <span className="text-red-500">*</span></label>
              <textarea
                rows={4}
                className="input-field h-auto py-2.5 resize-none"
                placeholder="Describe the problem in detail. What needs to be done? Any special requirements?"
                {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'At least 10 characters' } })}
              />
              <InlineError message={errors.description?.message} />
            </div>

            <div>
              <label className="label">Service Category</label>
              <select className="input-field" {...register('category_id')}>
                <option value="">Select category (optional)</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Kathmandu"
                  {...register('city', { required: 'City is required' })}
                />
                <InlineError message={errors.city?.message} />
              </div>
              <div>
                <label className="label">Area</label>
                <input type="text" className="input-field" placeholder="Baneshwor" {...register('area')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Preferred Date</label>
                <input
                  type="date"
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('scheduled_date')}
                />
              </div>
              <div>
                <label className="label">Time Preference</label>
                <select className="input-field" {...register('time_slot')}>
                  <option value="">Any time</option>
                  <option value="morning">Morning (6am–12pm)</option>
                  <option value="afternoon">Afternoon (12pm–6pm)</option>
                  <option value="evening">Evening (6pm–9pm)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Budget Range (Rs.) — optional</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" className="input-field" placeholder="Min (e.g. 500)" {...register('budget_min')} />
                <input type="number" min="0" className="input-field" placeholder="Max (e.g. 2000)" {...register('budget_max')} />
              </div>
              <p className="text-xs text-slate-400 mt-1">Leave blank if open to any quote.</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <strong>How it works:</strong> Your listing stays open for 30 days. Providers can apply with their quote and message. You review applications and award the job to who you like best.
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Posting…' : 'Post Job Listing'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
