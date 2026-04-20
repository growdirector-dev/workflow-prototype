import { useState } from 'react';
import { cn } from '@/lib/utils.js';
import { SENSORS, DAYS } from '@/lib/mockData.js';

// Sensor row for trigger
function SensorRow({ sensor, onRemove, onChange }) {
  const sensorInfo = SENSORS.find(s => s.id === sensor.sensorId);
  return (
    <div className="flex items-center gap-2 py-2">
      <select
        value={sensor.sensorId}
        onChange={e => onChange({ ...sensor, sensorId: e.target.value })}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white min-w-[120px]"
      >
        {SENSORS.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select
        value={sensor.operator}
        onChange={e => onChange({ ...sensor, operator: e.target.value })}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
      >
        <option>Higher than</option>
        <option>Lower than</option>
      </select>
      <input
        type="number"
        value={sensor.value}
        onChange={e => onChange({ ...sensor, value: Number(e.target.value) })}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-20 text-center"
      />
      <span className="text-sm text-gray-400">{sensorInfo?.unit}</span>
      <button
        onClick={onRemove}
        className="ml-auto text-gray-300 hover:text-gray-500 p-1"
      >
        ×
      </button>
    </div>
  );
}

// Time chip for schedule
function TimeChip({ time, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-medium">
      {time}
      <button onClick={onRemove} className="ml-1 opacity-60 hover:opacity-100 text-base leading-none">×</button>
    </span>
  );
}

export function TriggerSection({ workflow, onChange, disabled }) {
  const [newTime, setNewTime] = useState('');
  const isSensor = workflow.trigger.type === 'sensor';
  const isSchedule = workflow.trigger.type === 'schedule';

  const sensors = workflow.trigger.sensors || [];
  const times = workflow.trigger.times || [];
  const activeDays = workflow.trigger.days || [true, true, true, true, true, true, true];

  const handleModeSwitch = (type) => {
    if (type === workflow.trigger.type) return;
    const hasContent = isSensor ? sensors.length > 0 : times.length > 0;
    if (hasContent) {
      const ok = window.confirm('Changing mode will clear all configured sensors/times and Steps. Continue?');
      if (!ok) return;
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
    } else {
      onChange({
        ...workflow,
        trigger: {
          type,
          sensors: type === 'sensor' ? [] : undefined,
          times: type === 'schedule' ? [] : undefined,
          days: [true, true, true, true, true, true, true],
          activationDelay: { minutes: 0, seconds: 10 },
        },
      });
    }
  };

  const addSensor = () => {
    if (sensors.length >= 2) return;
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
    if (!newTime) return;
    if (times.includes(newTime)) return;
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
    const next = activeDays.map((d, i) => i === idx ? !d : d);
    onChange({ ...workflow, trigger: { ...workflow.trigger, days: next } });
  };

  const modeLabel = isSensor ? 'Sensor' : 'Schedule';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <button className="text-gray-400 text-sm">▾</button>
          <h3 className="text-sm font-semibold text-gray-800">Trigger</h3>
        </div>
        <span className="text-sm text-gray-400">{modeLabel}</span>
      </div>

      <div className="px-5 pb-5 border-t border-gray-50">
        {/* Mode selector */}
        <div className="mt-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">TRIGGER MODE</p>
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
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Sensor mode */}
        {isSensor && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">SENSORS</p>
            {sensors.map((sensor, idx) => (
              <div key={idx}>
                <SensorRow
                  sensor={sensor}
                  onChange={(updated) => updateSensor(idx, updated)}
                  onRemove={() => removeSensor(idx)}
                />
                {idx === 0 && sensors.length === 2 && (
                  <div className="flex items-center gap-2 py-1.5">
                    <span className="text-xs text-gray-400">Logic:</span>
                    {['AND', 'OR'].map(logic => (
                      <button
                        key={logic}
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
                    <span className="text-xs text-gray-400">
                      {workflow.trigger.logic === 'AND' ? 'All conditions must be met simultaneously' : 'Any one condition triggers workflow'}
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
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Activation delay: condition must hold continuously before Workflow starts.</p>
              <div className="flex items-center gap-2">
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
                  value={workflow.trigger.activationDelay?.seconds || 10}
                  onChange={e => onChange({ ...workflow, trigger: { ...workflow.trigger, activationDelay: { ...workflow.trigger.activationDelay, seconds: Number(e.target.value) } } })}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-16 text-center"
                  disabled={disabled}
                />
                <span className="text-sm text-gray-400">sec.</span>
              </div>
            </div>
          </div>
        )}

        {/* Schedule mode */}
        {isSchedule && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">SCHEDULE TYPE</p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-sm font-medium">Trigger at</span>
            </div>
            <p className="text-sm text-gray-400 mt-2 mb-3">Start a new run only at these exact times.</p>

            <div className="flex items-center flex-wrap gap-2 mb-3">
              {times.map(t => (
                <TimeChip key={t} time={t} onRemove={() => removeTime(t)} />
              ))}
              {!disabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={addTime}
                    className="text-sm text-[#2d6a4f] font-medium hover:underline"
                  >
                    + Add time
                  </button>
                </div>
              )}
            </div>

            {/* Days of week */}
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">DAYS</p>
              <div className="flex gap-2">
                {DAYS.map((day, idx) => (
                  <button
                    key={day}
                    disabled={disabled}
                    onClick={() => toggleDay(idx)}
                    className={cn(
                      'w-9 h-9 rounded-full text-xs font-semibold transition-colors',
                      activeDays[idx]
                        ? 'bg-[#7dbf9e] text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
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
  );
}
