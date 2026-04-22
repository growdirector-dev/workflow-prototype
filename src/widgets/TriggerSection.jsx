import { useState } from 'react';
import { cn } from '@/lib/utils.js';
import { SENSORS, DAYS } from '@/lib/mockData.js';
import { ConfirmDialog } from '@/widgets/ui.jsx';

// Sensor row for trigger — only sensor selection, no operator/value
function SensorRow({ sensor, onRemove, onChange, disabled }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <select
        value={sensor.sensorId}
        onChange={e => onChange({ ...sensor, sensorId: e.target.value })}
        disabled={disabled}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white min-w-[140px]"
      >
        {SENSORS.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      {!disabled && (
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-400 p-1 text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}

// Time chip for schedule
function TimeChip({ time, onRemove, disabled }) {
  return (
    <span className="inline-flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-medium">
      {time}
      {!disabled && (
        <button onClick={onRemove} className="ml-1 opacity-60 hover:opacity-100 text-base leading-none">×</button>
      )}
    </span>
  );
}

export function TriggerSection({ workflow, onChange, disabled, saveAttempted }) {
  const [newTime, setNewTime] = useState('');
  const [modeSwitchDialog, setModeSwitchDialog] = useState(null); // target type
  const isSensor = workflow.trigger.type === 'sensor';
  const isSchedule = workflow.trigger.type === 'schedule';

  const sensors = workflow.trigger.sensors || [];
  const times = workflow.trigger.times || [];
  const activeDays = workflow.trigger.days || [true, true, true, true, true, true, true];

  const doModeSwitch = (type) => {
    onChange({
      ...workflow,
      trigger: {
        type,
        sensors: type === 'sensor' ? [] : undefined,
        times: type === 'schedule' ? [] : undefined,
        days: [true, true, true, true, true, true, true],
        activationDelay: { minutes: 0, seconds: 10 },
      },
      steps: [],
    });
  };

  const handleModeSwitch = (type) => {
    if (type === workflow.trigger.type) return;
    const hasContent = isSensor ? sensors.length > 0 || workflow.steps?.length > 0 : times.length > 0 || workflow.steps?.length > 0;
    if (hasContent) {
      setModeSwitchDialog(type);
    } else {
      doModeSwitch(type);
    }
  };

  const addSensor = () => {
    if (sensors.length >= 2 || disabled) return;
    onChange({
      ...workflow,
      trigger: {
        ...workflow.trigger,
        sensors: [...sensors, { sensorId: 's1', operator: 'Higher than', value: 20, unit: '°C', currentValue: null }],
        logic: sensors.length >= 1 ? (workflow.trigger.logic || 'AND') : null,
      },
    });
  };

  const updateSensor = (idx, updated) => {
    const next = sensors.map((s, i) => i === idx ? updated : s);
    onChange({ ...workflow, trigger: { ...workflow.trigger, sensors: next } });
  };

  const removeSensor = (idx) => {
    const next = sensors.filter((_, i) => i !== idx);
    onChange({
      ...workflow,
      trigger: {
        ...workflow.trigger,
        sensors: next,
        logic: next.length < 2 ? null : workflow.trigger.logic,
      },
    });
  };

  const addTime = () => {
    if (!newTime || disabled) return;
    if (times.includes(newTime)) { setNewTime(''); return; }
    onChange({
      ...workflow,
      trigger: { ...workflow.trigger, times: [...times, newTime].sort() },
    });
    setNewTime('');
  };

  const removeTime = (t) => {
    onChange({
      ...workflow,
      trigger: { ...workflow.trigger, times: times.filter(x => x !== t) },
    });
  };

  const toggleDay = (idx) => {
    if (disabled) return;
    const next = activeDays.map((d, i) => i === idx ? !d : d);
    onChange({ ...workflow, trigger: { ...workflow.trigger, days: next } });
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Trigger</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {isSensor ? 'Sensor' : 'Schedule'}
            </span>
          </div>

          {/* Mode selector */}
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">MODE</p>
            <div className="flex gap-2">
              {['Sensor', 'Schedule'].map(mode => (
                <button
                  key={mode}
                  disabled={disabled}
                  onClick={() => handleModeSwitch(mode.toLowerCase())}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    workflow.trigger.type === mode.toLowerCase()
                      ? 'bg-[#2d6a4f] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    disabled && 'opacity-60 cursor-default'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* ── Sensor mode ── */}
          {isSensor && (() => {
            const hasSensorError = saveAttempted && sensors.length === 0;
            return (
            <div className={cn('rounded-xl transition-colors', hasSensorError && 'border border-red-300 bg-red-50/40 p-3 -mx-1')}>
              <p className={cn('text-xs uppercase tracking-widest font-semibold mb-1', hasSensorError ? 'text-red-500' : 'text-gray-400')}>SENSORS (up to 2)</p>
              {hasSensorError && (
                <p className="text-xs text-red-500 mb-2">At least one sensor is required to save this Workflow.</p>
              )}
              {sensors.map((sensor, idx) => (
                <div key={idx}>
                  <SensorRow
                    sensor={sensor}
                    onChange={(updated) => updateSensor(idx, updated)}
                    onRemove={() => removeSensor(idx)}
                    disabled={disabled}
                  />
                  {idx === 0 && sensors.length === 2 && (
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs text-gray-400">Logic:</span>
                      {['AND', 'OR'].map(logic => (
                        <button
                          key={logic}
                          disabled={disabled}
                          onClick={() => onChange({ ...workflow, trigger: { ...workflow.trigger, logic } })}
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
                            workflow.trigger.logic === logic
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                          )}
                        >
                          {logic}
                        </button>
                      ))}
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        {workflow.trigger.logic === 'AND' ? '— all conditions simultaneously' : '— any one condition triggers'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {sensors.length < 2 && !disabled && (
                <button
                  onClick={addSensor}
                  className="text-sm text-[#2d6a4f] font-medium hover:underline mt-1"
                >
                  + Add Sensor
                </button>
              )}

              {/* Activation delay */}
              <div className="mt-4 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-2">
                  <span className="font-semibold text-gray-500">Activation delay</span> — condition must hold continuously before Workflow starts.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    min="0"
                    value={workflow.trigger.activationDelay?.minutes || 0}
                    onChange={e => onChange({ ...workflow, trigger: { ...workflow.trigger, activationDelay: { ...workflow.trigger.activationDelay, minutes: Number(e.target.value) } } })}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-16 text-center"
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-400">min.</span>
                  <input
                    type="number"
                    min="0"
                    value={workflow.trigger.activationDelay?.seconds ?? 10}
                    onChange={e => onChange({ ...workflow, trigger: { ...workflow.trigger, activationDelay: { ...workflow.trigger.activationDelay, seconds: Number(e.target.value) } } })}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-16 text-center"
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-400">sec.</span>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ── Schedule mode ── */}
          {isSchedule && (
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">TRIGGER TIMES</p>
              <div className="flex items-center flex-wrap gap-2 mb-3">
                {times.map(t => (
                  <TimeChip key={t} time={t} onRemove={() => removeTime(t)} disabled={disabled} />
                ))}
                {!disabled && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="time"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <button
                      onClick={addTime}
                      disabled={!newTime}
                      className="text-sm text-[#2d6a4f] font-medium hover:underline disabled:opacity-40"
                    >
                      + Add time
                    </button>
                  </div>
                )}
              </div>

              {/* Days of week */}
              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">DAYS</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((day, idx) => (
                    <button
                      key={day}
                      disabled={disabled}
                      onClick={() => toggleDay(idx)}
                      className={cn(
                        'w-9 h-9 rounded-full text-xs font-semibold transition-colors',
                        activeDays[idx]
                          ? 'bg-[#2d6a4f] text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200',
                        disabled && 'cursor-default'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode switch confirm dialog */}
      <ConfirmDialog
        open={!!modeSwitchDialog}
        title="Switch Trigger Mode?"
        description="Changing mode will clear all configured sensors/times and all Steps. This cannot be undone."
        confirmLabel="Switch & Clear"
        confirmVariant="danger"
        onConfirm={() => { doModeSwitch(modeSwitchDialog); setModeSwitchDialog(null); }}
        onCancel={() => setModeSwitchDialog(null)}
      />
    </>
  );
}
