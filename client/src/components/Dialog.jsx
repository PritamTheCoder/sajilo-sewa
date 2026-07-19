import { useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// The app's only overlay primitive — every modal, drawer, sheet and confirm
// routes through here. Bottom sheet on mobile, centered modal from sm up.
export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  initialFocusRef,
}) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useId();
  const descId = useId();

  const sizes = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
  };

  // Bound on the panel, not the document, so a nested overlay can't close its parent.
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;

    // Padding compensates for the scrollbar so the page doesn't shift sideways.
    const { body } = document;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const target =
      initialFocusRef?.current ||
      panelRef.current?.querySelector(FOCUSABLE) ||
      panelRef.current;
    target?.focus?.();

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      // Return focus to the trigger so keyboard users keep their place.
      previouslyFocused.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-dialog flex items-end justify-center sm:items-center sm:p-4"
      onKeyDown={onKeyDown}
    >
      {/* Scrim is presentational; Esc and the close button are the real exits. */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative w-full ${sizes[size]} bg-surface shadow-xl
          rounded-t-2xl sm:rounded-2xl
          max-h-[90vh] flex flex-col
          animate-sheet-up sm:animate-slide-up
          focus:outline-none`}
      >
        {/* Grab handle for the mobile sheet. */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>

        <header className="flex items-start justify-between gap-4 px-5 pt-4 sm:pt-5 pb-3 shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="text-h3 text-text">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-body-sm text-text-muted mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 -mr-1 -mt-1 w-11 h-11 flex items-center justify-center rounded-lg
              text-text-subtle hover:text-text hover:bg-surface-hover transition-colors duration-fast"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="px-5 pb-5 overflow-y-auto grow">{children}</div>

        {footer && (
          <div className="px-5 py-4 border-t border-border shrink-0 pb-safe sm:pb-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Confirmation for destructive or irreversible actions. Takes children so the
// dialog can show what is actually being confirmed.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  children,
}) {
  const confirmRef = useRef(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      initialFocusRef={confirmRef}
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="btn-outline">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
          >
            {loading && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      }
    >
      {children}
    </Dialog>
  );
}
