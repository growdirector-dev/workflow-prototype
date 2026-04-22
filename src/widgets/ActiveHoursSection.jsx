import { useState } from 'react';
import { cn } from '@/lib/utils.js';
import { Toggle } from '@/widgets/ui.jsx';
import { DAYS } from '@/lib/mockData.js';

export function ActiveHoursSection({ workflow, onChange, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const [savedDays, setSavedDays] = useState(
    (workflow.activeHours?.days) || [true, true, true, true, true, true, true]
  );

  // Active hours only for sensor mode
  if (workflow.trigger.type !== 'sensor') return null;

  const activeHours = workflow.activeHours || {
    enabled: false,
    from: '06:00',
    until: '18:00',
    days: [true, true, true, true, true, true, true],
  };

  const handleToggle = (enabled) => {
    if (enabled) {
      onChange({
        ...workflow,
        activeHours: {
          enabled: true,
          from: '06:00',
          until: '18:00',
          days: savedDays,
        },
      });
    } else {
      // Save days, reset time range
      setSavedDays(activeHours.days);
      onChange({
        ...workflow,
        activeHours: {
          ...activeHours,
          enabled: false,
          from: '06:00',
          until: '18:00',
          // days preserved
        },
      });
    }
  };

  const updateField = (field, value) => {
    onChange({ ...workflow, activeHours: { ...activeHours, [field]: value } });
  };

  const toggleDay = (idx) => {
    const next = activeHours.days.map((d, i) => i === idx ? !d : d);
    onChange({ ...workflow, activeHours: { ...activeHours, days: next } });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <button className="text-gray-400 text-sm">{expanded ? '▾' : '›'}</button>
          <h3 className="text-sm font-semibold text-gray-800">Active Hours</h3>
        </div>
        <div onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{activeHours.enabled ? 'Enabled' : 'Disabled'}</span>
            <Toggle
              checked={activeHours.enabled}
              onChange={handleToggle}
              disabled={disabled}
              size="sm"
            />
          </div>
        </div>
      </div>

      {expanded && activeHours.enabled && (
        <div className="px-5 pb-5 border-t border-gray-50">
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">From</label>
              <input
                type="time"
                value={activeHours.from}
                onChange={e => updateField('from', e.target.value)}
                disabled={disabled}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Until</label>
              <input
                type="time"
                value={activeHours.until}
                onChange={e => updateField('until', e.target.value)}
                disabled={disabled}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {DAYS.map((day, idx) => (
              <button
                key={day}
                disabled={disabled}
                onClick={() => toggleDay(idx)}
                className={cn(
                  'w-9 h-9 rounded-full text-xs font-semibold transition-colors',
                  activeHours.days[idx]
                    ? 'bg-[#7dbf9e] text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {expanded && !activeHours.enabled && (
        <div className="px-5 pb-4 border-t border-gray-50">
          <p className="text-sm text-gray-400 mt-3">Active Hours are disabled. Enable to restrict when this Workflow can trigger.</p>
        </div>
      )}
    </div>
  );
}
