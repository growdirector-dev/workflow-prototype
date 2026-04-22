import { cn } from '@/lib/utils.js';

// iOS-style toggle
export function Toggle({ checked, onChange, disabled = false, size = 'md' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none',
        size === 'sm' ? 'h-5 w-9' : 'h-7 w-12',
        checked ? 'bg-[#2d6a4f]' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer'
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5',
          size === 'sm'
            ? checked ? 'translate-x-[18px]' : 'translate-x-0.5'
            : checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// Status badge
const STATUS_STYLES = {
  running:       'bg-blue-100 text-blue-700',
  synchronizing: 'bg-amber-100 text-amber-700',
  idle:          'bg-gray-100 text-gray-600',
  completed:     'bg-green-100 text-green-700',
  error:         'bg-red-100 text-red-600',
  disabled:      'bg-gray-100 text-gray-400',
  new:           'bg-gray-100 text-gray-500',
};

const STATUS_DOTS = {
  running:       'bg-blue-500 animate-pulse',
  synchronizing: 'bg-amber-500 animate-pulse',
  idle:          null,
  completed:     null,
  error:         null,
  disabled:      null,
  new:           null,
};

export function StatusBadge({ status }) {
  const labels = {
    running: 'Running',
    synchronizing: 'Syncing',
    idle: 'Idle',
    completed: 'Done',
    error: 'Error',
    disabled: 'Disabled',
    new: 'New',
  };
  const label = labels[status] || (status.charAt(0).toUpperCase() + status.slice(1));
  const dot = STATUS_DOTS[status];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[status] || 'bg-gray-100 text-gray-600')}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />}
      {label}
    </span>
  );
}

// Step status badge (smaller)
const STEP_STATUS_STYLES = {
  pending: 'text-gray-400',
  running: 'text-blue-600 font-semibold',
  waiting: 'text-amber-600',
  done: 'text-green-600 font-semibold',
  error: 'text-red-500 font-semibold',
};

export function StepStatusBadge({ status }) {
  const labels = {
    pending: 'Pending',
    running: 'Running',
    waiting: 'Waiting',
    done: 'Done',
    error: 'Error',
  };
  const label = labels[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '—');
  return (
    <span className={cn('text-sm', STEP_STATUS_STYLES[status] || 'text-gray-400')}>
      {label}
    </span>
  );
}

// Priority badge
export function PriorityBadge({ priority }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold shrink-0 bg-gray-200 text-gray-600">
      {priority}
    </span>
  );
}

// Confirm Dialog
export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', confirmVariant = 'danger', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-semibold',
              confirmVariant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[#2d6a4f] text-white hover:bg-[#245a42]'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Alert banner
export function AlertBanner({ message, variant = 'error' }) {
  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-xl mb-4 text-sm',
      variant === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
    )}>
      <span className="text-base shrink-0">⚠</span>
      <div>
        <p className="font-semibold">{message}</p>
        {variant === 'error' && (
          <p className="text-xs mt-0.5 text-red-500">Resolve the issue and re-enable the Workflow to restart from the beginning.</p>
        )}
      </div>
    </div>
  );
}

// Inline error message for conflict on step
export function ConflictBanner({ message }) {
  return (
    <div className="flex items-center gap-2 mt-1 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  );
}
