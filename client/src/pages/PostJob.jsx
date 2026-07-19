import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createJobListing } from '../api/jobs';
import { getCategories } from '../api/categories';
import { useToast } from '../context/ToastContext';
import { InlineError } from '../components/ErrorMessage';
import Layout from '../components/Layout';

const InfoIcon = (
  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

export default function PostJob() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesFailed, setCategoriesFailed] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  useEffect(() => {
    getCategories()
      .then((c) => setCategories(c.filter((x) => x.is_active)))
      .catch(() => setCategoriesFailed(true));
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await createJobListing({
        title: data.title,
        description: data.description,
        city: data.city,
        area: data.area || undefined,
        category_id: data.category_id ? parseInt(data.category_id, 10) : undefined,
        scheduled_date: data.scheduled_date || undefined,
        time_slot: data.time_slot || undefined,
        budget_min: data.budget_min ? parseFloat(data.budget_min) : undefined,
        budget_max: data.budget_max ? parseFloat(data.budget_max) : undefined,
      });
      addToast('Job listing posted. Providers can now apply.', 'success');
      navigate('/jobs');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      addToast(
        Array.isArray(detail) ? detail[0]?.msg : detail || 'Could not post listing.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Post a job" width="form">
      <header className="mb-6">
        <h1 className="text-h1 text-text">Post a job</h1>
        <p className="text-body-sm text-text-muted mt-1">
          Describe what you need — verified providers will apply directly.
        </p>
      </header>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label htmlFor="job-title" className="label">
              Job title <span className="text-danger">*</span>
            </label>
            <input
              id="job-title"
              type="text"
              aria-invalid={errors.title ? 'true' : undefined}
              className="input-field"
              placeholder="e.g. Fix leaking kitchen pipe"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 5, message: 'At least 5 characters' },
              })}
            />
            <InlineError message={errors.title?.message} />
          </div>

          <div>
            <label htmlFor="job-description" className="label">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              id="job-description"
              rows={4}
              aria-invalid={errors.description ? 'true' : undefined}
              className="input-field resize-none"
              placeholder="Describe the problem in detail. What needs to be done? Any special requirements?"
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'At least 10 characters' },
              })}
            />
            <InlineError message={errors.description?.message} />
          </div>

          <div>
            <label htmlFor="job-category" className="label">Service category</label>
            <select
              id="job-category"
              disabled={categoriesFailed}
              className="input-field"
              {...register('category_id')}
            >
              <option value="">
                {categoriesFailed ? 'Categories unavailable' : 'Select category (optional)'}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="job-city" className="label">
                City <span className="text-danger">*</span>
              </label>
              <input
                id="job-city"
                type="text"
                autoComplete="address-level2"
                aria-invalid={errors.city ? 'true' : undefined}
                className="input-field"
                placeholder="Kathmandu"
                {...register('city', { required: 'City is required' })}
              />
              <InlineError message={errors.city?.message} />
            </div>
            <div>
              <label htmlFor="job-area" className="label">Area</label>
              <input
                id="job-area"
                type="text"
                className="input-field"
                placeholder="Baneshwor"
                {...register('area')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="job-date" className="label">Preferred date</label>
              <input
                id="job-date"
                type="date"
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
                {...register('scheduled_date')}
              />
            </div>
            <div>
              <label htmlFor="job-slot" className="label">Time preference</label>
              <select id="job-slot" className="input-field" {...register('time_slot')}>
                <option value="">Any time</option>
                <option value="morning">Morning (6am–12pm)</option>
                <option value="afternoon">Afternoon (12pm–6pm)</option>
                <option value="evening">Evening (6pm–9pm)</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>

          <fieldset>
            <legend className="label">Budget range (Rs.) — optional</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="budget-min" className="sr-only">Minimum budget</label>
                <input
                  id="budget-min"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="input-field"
                  placeholder="Min (e.g. 500)"
                  {...register('budget_min')}
                />
              </div>
              <div>
                <label htmlFor="budget-max" className="sr-only">Maximum budget</label>
                <input
                  id="budget-max"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  aria-invalid={errors.budget_max ? 'true' : undefined}
                  className="input-field"
                  placeholder="Max (e.g. 2000)"
                  {...register('budget_max', {
                    validate: (value) => {
                      const min = getValues('budget_min');
                      if (!value || !min) return true;
                      return (
                        parseFloat(value) >= parseFloat(min) ||
                        'Maximum must be at least the minimum'
                      );
                    },
                  })}
                />
              </div>
            </div>
            <InlineError message={errors.budget_max?.message} />
            <span className="hint">Leave blank if open to any quote.</span>
          </fieldset>

          <div className="callout-info">
            {InfoIcon}
            <p>
              <strong>How it works:</strong> your listing stays open for 30 days. Providers
              apply with a quote and a message, and you award the job to whoever you like best.
            </p>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
            {submitting ? 'Posting…' : 'Post job listing'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
