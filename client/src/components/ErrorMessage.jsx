export default function ErrorMessage({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-4 py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-danger-subtle flex items-center justify-center">
        <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-body-sm font-medium text-text max-w-sm">
        {message || 'Something went wrong. Please try again.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm">
          Try again
        </button>
      )}
    </div>
  );
}

export function InlineError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-caption text-danger mt-1.5 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}
