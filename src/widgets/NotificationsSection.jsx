import { useState } from 'react';
import { Toggle } from '@/widgets/ui.jsx';

export function NotificationsSection({ workflow, onChange, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const notifications = workflow.notifications || { onCompletion: true, onFailure: true };

  const onCount = [notifications.onCompletion, notifications.onFailure].filter(Boolean).length;

  const update = (field, value) => {
    onChange({ ...workflow, notifications: { ...notifications, [field]: value } });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <button className="text-gray-400 text-sm">{expanded ? '▾' : '›'}</button>
          <span className="text-sm">🔔</span>
          <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
        </div>
        <span className="text-sm text-[#2d6a4f] font-medium">Push · {onCount} on</span>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">On completion</p>
              <p className="text-xs text-gray-400">Default: on</p>
            </div>
            <Toggle
              checked={notifications.onCompletion}
              onChange={v => update('onCompletion', v)}
              disabled={disabled}
              size="sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">On failure</p>
              <p className="text-xs text-gray-400">Default: on</p>
            </div>
            <Toggle
              checked={notifications.onFailure}
              onChange={v => update('onFailure', v)}
              disabled={disabled}
              size="sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
