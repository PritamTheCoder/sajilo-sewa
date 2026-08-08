import { useState } from 'react';
import { ConfirmDialog } from './Dialog';
import { createDispute } from '../api/disputes';
import { useToast } from '../context/ToastContext';

const REASONS = [
  { value: 'no_show', label: 'Nobody showed up' },
  { value: 'quality', label: 'Quality of work' },
  { value: 'payment', label: 'Payment problem' },
  { value: 'conduct', label: 'Behaviour or conduct' },
  { value: 'other', label: 'Something else' },
];

export default function ReportDialog({ booking, onClose, onReported }) {
  const { addToast } = useToast();
  const [reason, setReason] = useState('no_show');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createDispute({ booking_id: booking.id, reason, description: description.trim() });
      addToast('Report submitted. An admin will review it.', 'success');
      onReported?.(booking.id);
      onClose();
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Could not submit your report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(booking)}
      onClose={onClose}
      onConfirm={handleSubmit}
      loading={submitting}
      tone="primary"
      title="Report a problem"
      description={`Tell us what went wrong with booking #${booking?.id}. An admin will review it.`}
      confirmLabel="Submit report"
    >
      <label htmlFor="report-reason" className="label">What happened?</label>
      <select
        id="report-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="input-field mb-3"
      >
        {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>

      <label htmlFor="report-description" className="label">Details</label>
      <textarea
        id="report-description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input-field h-auto py-2.5 resize-none"
        placeholder="Describe what happened so an admin can look into it"
      />
      <span className="hint">At least 10 characters. Shared with the admin team only.</span>
    </ConfirmDialog>
  );
}
