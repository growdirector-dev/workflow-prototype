import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils.js';
import { DEVICES, SENSORS } from '@/lib/mockData.js';
import { StepStatusBadge, ConflictBanner } from '@/widgets/ui.jsx';

// Custom device picker — shows yellow label for Rule/Workflow devices per spec
// Uses fixed positioning for dropdown so it's never clipped by overflow containers
function DeviceSelect({ value, onChange, disabled, conflicts }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const ref = useRef(null);
  const conflict = conflicts?.[value];
  const selected = DEVICES.find(d => d.id === value);

  // Position the fixed dropdown below the trigger button
  const openDropdown = (e) => {
    e.preventDefault();
    if (disabled) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setDropPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
      });
    }
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!ref.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const deviceLabel = (d) => {
    if (d.status === 'rule') return `${d.name} (Rule)`;
    if (d.status === 'workflow') return `${d.name} (Workflow)`;
    return d.name;
  };

  const triggerTextColor = () => {
    if (!selected) return 'text-gray-400';
    if (selected.status === 'rule' || selected.status === 'workflow') return 'text-amber-700';
    return 'text-gray-800';
  };

  return (
    <div className="w-full">
      {/* Trigger button */}
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        className={cn(
          'border rounded-lg px-2 py-1.5 text-sm bg-white w-full text-left flex items-center justify-between gap-1',
          conflict ? 'border-amber-400' : 'border-gray-200',
          disabled && 'opacity-60 cursor-default bg-gray-50'
        )}
      >
        <span className={cn('truncate', triggerTextColor())}>
          {selected ? deviceLabel(selected) : 'Select device…'}
        </span>
        <span className="text-gray-300 shrink-0 text-xs">▾</span>
      </button>

      {/* Fixed dropdown — never clipped by overflow containers */}
      {open && (
        <div
          ref={ref}
          style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
        >
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
          >
            Select device…
          </button>
          {DEVICES.map(d => {
            const isOccupied = d.status === 'rule' || d.status === 'workflow';
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => { onChange(d.id); setOpen(false); }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors',
                  d.id === value && 'bg-green-50',
                  isOccupied ? 'text-amber-700' : 'text-gray-800'
                )}
              >
                <span className="truncate">{d.name}</span>
                {d.status === 'rule' && (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">(Rule)</span>
                )}
                {d.status === 'workflow' && (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">(Workflow)</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {conflict && <ConflictBanner message={conflict} />}
    </div>
  );
}

// A single sensor data row within a step (FROM / CURRENT / UNTIL)
function SensorDataRow({ row, rIdx, triggerLogic, onUpdate, onRemove, disabled, fromDisabled, untilError, fromError }) {
  const sensorInfo = SENSORS.find(s => s.id === row.sensorId);
  const isFromDisabled = fromDisabled ?? disabled;
  const showFromError = fromError && (row.from == null || row.from === '');

  return (
    <div>
      {rIdx > 0 && (
        <div className="py-1">
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded',
            (triggerLogic || 'AND') === 'AND' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
          )}>
            {triggerLogic || 'AND'}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        {/* Sensor name */}
        <span className="text-sm text-gray-700 w-24 shrink-0 truncate">{sensorInfo?.name || row.sensorId}</span>

        {/* OPERATOR — direction > or < */}
        <div className="w-12 shrink-0">
          <select
            value={row.operator || '>'}
            onChange={e => onUpdate(rIdx, 'operator', e.target.value)}
            disabled={isFromDisabled}
            className={cn(
              'border rounded-lg px-1 py-1 text-sm bg-white w-12 text-center',
              isFromDisabled ? 'border-gray-100 bg-gray-50 text-gray-400' : 'border-gray-200'
            )}
          >
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
          </select>
        </div>

        {/* FROM */}
        <input
          type="number"
          min="0"
          value={row.from ?? ''}
          onChange={e => onUpdate(rIdx, 'from', Number(e.target.value))}
          disabled={isFromDisabled}
          className={cn(
            'border rounded-lg px-1.5 py-1 text-sm w-14 text-center shrink-0',
            showFromError ? 'border-red-400' : isFromDisabled ? 'border-gray-100 bg-gray-50 text-gray-400' : 'border-gray-200'
          )}
        />

        {/* CURRENT */}
        <span className={cn(
          'rounded-lg px-1.5 py-1 text-sm w-14 text-center font-medium border block shrink-0',
          row.currentValue != null
            ? 'border-teal-200 bg-teal-50 text-teal-700'
            : 'border-gray-100 bg-gray-50 text-gray-300'
        )}>
          {row.currentValue != null ? row.currentValue : '–'}
        </span>

        {/* UNTIL */}
        <input
          type="number"
          min="0"
          value={row.until ?? ''}
          onChange={e => onUpdate(rIdx, 'until', Number(e.target.value))}
          disabled={disabled}
          className={cn('border rounded-lg px-1.5 py-1 text-sm w-14 text-center shrink-0', untilError && (row.until == null || row.until === '') ? 'border-red-400' : 'border-gray-200')}
        />

        <span className="text-xs text-gray-400 shrink-0">{sensorInfo?.unit}</span>

        {/* Remove sensor row */}
        {!disabled && (
          <button
            onClick={() => onRemove(rIdx)}
            className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0"
          >×</button>
        )}
      </div>
    </div>
  );
}

export function SensorStepRow({ step, index, triggerSensors, triggerLogic, onChange, onRemove, disabled, saveAttempted, stepConflicts }) {
  const sensorRows = step.sensorRows || [];

  const updateParam = (key, val) => onChange({ ...step, params: { ...step.params, [key]: val } });

  const updateSensorRow = (rIdx, field, val) => {
    onChange({ ...step, sensorRows: sensorRows.map((r, i) => i === rIdx ? { ...r, [field]: val } : r) });
  };

  const removeSensorRow = (rIdx) => {
    onChange({ ...step, sensorRows: sensorRows.filter((_, i) => i !== rIdx) });
  };

  // Sensors that exist in trigger but are missing from this step's rows
  const missingSensors = (triggerSensors || []).filter(
    ts => !sensorRows.some(r => r.sensorId === ts.sensorId)
  );

  const restoreSensor = (ts) => {
    const newRow = { sensorId: ts.sensorId, from: ts.value, currentValue: null, until: '' };
    onChange({ ...step, sensorRows: [...sensorRows, newRow] });
  };

  const hasDeviceError = saveAttempted && !step.deviceId;
  const actionType = step.actionType || 'Regular';
  const hasUntilError   = saveAttempted && sensorRows.some(r => r.until == null || r.until === '');
  const hasFromError    = saveAttempted && sensorRows.some(r => r.from == null || r.from === '');
  const hasRunError     = saveAttempted && actionType === 'Stepper Motor' && !step.params?.run;
  const hasWaitError    = saveAttempted && actionType === 'Stepper Motor' && !step.params?.wait;
  const hasTimesError   = saveAttempted && actionType === 'Loop' && !step.params?.times;
  const hasLoopOnError  = saveAttempted && actionType === 'Loop' && !step.params?.on;
  const hasLoopOffError = saveAttempted && actionType === 'Loop' && !step.params?.off;
  const hasAnyError = hasDeviceError || hasUntilError || hasFromError || hasRunError || hasWaitError || hasTimesError || hasLoopOnError || hasLoopOffError;

  const statusColor =
    step.status === 'running' ? 'border-blue-400 bg-blue-50/30' :
    step.status === 'waiting' ? 'border-amber-300 bg-amber-50/20' :
    step.status === 'done'    ? 'border-green-300' :
    step.status === 'error'   ? 'border-red-300 bg-red-50/20' :
                                'border-gray-100';

  return (
    <div
      data-error={hasAnyError ? 'true' : 'false'}
      className={cn('border rounded-2xl overflow-hidden transition-colors', statusColor, hasAnyError && 'border-red-400')}
    >
      {/* Mobile: vertical stack. Desktop: horizontal row */}
      <div className="p-3 space-y-3">

        {/* Row 1: Step number + Device + Status */}
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-gray-400 w-5 pt-2 text-center shrink-0">{index + 1}</span>

          <div className="flex-1 min-w-0">
            <DeviceSelect
              value={step.deviceId}
              onChange={v => onChange({ ...step, deviceId: v })}
              disabled={disabled}
              conflicts={stepConflicts}
            />
            {hasDeviceError && <p className="text-[10px] text-red-500 mt-0.5">Required</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StepStatusBadge status={step.status || 'pending'} />
            {!disabled && (
              <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
            )}
          </div>
        </div>

        {/* Row 2: Action type + Params */}
        <div className="flex flex-wrap items-start gap-3 pl-8">
          <div className="shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Action type</p>
            <select
              value={step.actionType || 'Regular'}
              onChange={e => onChange({ ...step, actionType: e.target.value, params: {} })}
              disabled={disabled}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white w-32"
            >
              <option>Regular</option>
              <option>Stepper Motor</option>
              <option>Loop</option>
            </select>
          </div>

          {/* Params */}
          {step.actionType === 'Stepper Motor' && (
            <div className="shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Params</p>
              <div className="flex gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <input type="text" placeholder="00:00" value={step.params?.run || ''} onChange={e => updateParam('run', e.target.value)} disabled={disabled}
                    className={cn('border rounded-lg px-1.5 py-1 text-sm w-16 text-center', hasRunError ? 'border-red-400' : 'border-gray-200')} />
                  <span className={cn('text-[10px]', hasRunError ? 'text-red-400' : 'text-gray-400')}>RUN (S)</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <input type="text" placeholder="00:00" value={step.params?.wait || ''} onChange={e => updateParam('wait', e.target.value)} disabled={disabled}
                    className={cn('border rounded-lg px-1.5 py-1 text-sm w-16 text-center', hasWaitError ? 'border-red-400' : 'border-gray-200')} />
                  <span className={cn('text-[10px]', hasWaitError ? 'text-red-400' : 'text-gray-400')}>WAIT (S)</span>
                </div>
              </div>
            </div>
          )}

          {step.actionType === 'Loop' && (
            <div className="shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Params</p>
              <div className="flex gap-1.5">
                <div className="flex flex-col items-center gap-0.5">
                  <input type="number" min="0" value={step.params?.times || ''} onChange={e => updateParam('times', Number(e.target.value))} disabled={disabled}
                    className={cn('border rounded-lg px-1 py-1 text-sm w-12 text-center', hasTimesError ? 'border-red-400' : 'border-gray-200')} />
                  <span className={cn('text-[10px]', hasTimesError ? 'text-red-400' : 'text-gray-400')}>TIMES</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <input type="text" placeholder="00:00" value={step.params?.on || ''} onChange={e => updateParam('on', e.target.value)} disabled={disabled}
                    className={cn('border rounded-lg px-1 py-1 text-sm w-14 text-center', hasLoopOnError ? 'border-red-400' : 'border-gray-200')} />
                  <span className={cn('text-[10px]', hasLoopOnError ? 'text-red-400' : 'text-gray-400')}>ON (S)</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <input type="text" placeholder="00:00" value={step.params?.off || ''} onChange={e => updateParam('off', e.target.value)} disabled={disabled}
                    className={cn('border rounded-lg px-1 py-1 text-sm w-14 text-center', hasLoopOffError ? 'border-red-400' : 'border-gray-200')} />
                  <span className={cn('text-[10px]', hasLoopOffError ? 'text-red-400' : 'text-gray-400')}>OFF (S)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Sensor rows with column headers */}
        {(sensorRows.length > 0 || missingSensors.length > 0) && (
          <div className="pl-8 space-y-1">
            {/* Mini column headers for sensor rows */}
            {sensorRows.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold pb-1">
                <span className="w-24 shrink-0">Sensor</span>
                <span className="w-12 text-center">OP</span>
                <span className="w-14 text-center">From</span>
                <span className="w-14 text-center">Now</span>
                <span className="w-14 text-center">Until</span>
              </div>
            )}
            {sensorRows.map((row, rIdx) => (
              <SensorDataRow
                key={rIdx}
                row={row}
                rIdx={rIdx}
                triggerLogic={triggerLogic}
                onUpdate={updateSensorRow}
                onRemove={removeSensorRow}
                disabled={disabled}
                fromDisabled={disabled || (step.status && step.status !== 'pending')}
                untilError={hasUntilError}
                fromError={hasFromError}
              />
            ))}
            {!disabled && missingSensors.map(ts => {
              const sInfo = SENSORS.find(s => s.id === ts.sensorId);
              return (
                <button
                  key={ts.sensorId}
                  type="button"
                  onClick={() => restoreSensor(ts)}
                  className="text-xs text-[#2d6a4f] font-medium hover:underline mt-0.5 flex items-center gap-1"
                >
                  <span>+</span>
                  <span>{sInfo?.name || ts.sensorId}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Conflict banners */}
        {(stepConflicts || []).map((c, i) => (
          <div key={i} className="pl-8">
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              {c.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScheduleStepRow({ step, index, onChange, onRemove, disabled, saveAttempted, stepConflicts }) {
  const updateParam = (key, val) => onChange({ ...step, params: { ...step.params, [key]: val } });
  const hasDeviceError   = saveAttempted && !step.deviceId;
  const hasDurationError = saveAttempted && (step.action === 'On' || !step.action) && !step.params?.duration;
  const hasPulseOnError  = saveAttempted && step.action === 'Pulse' && !step.params?.on;
  const hasPulseOffError = saveAttempted && step.action === 'Pulse' && !step.params?.off;
  const hasCyclesError   = saveAttempted && step.action === 'Pulse' && !step.params?.cycles;
  const hasAnyError = hasDeviceError || hasDurationError || hasPulseOnError || hasPulseOffError || hasCyclesError;

  const statusColor =
    step.status === 'running' ? 'border-blue-400 bg-blue-50/30' :
    step.status === 'waiting' ? 'border-amber-300 bg-amber-50/20' :
    step.status === 'done'    ? 'border-green-300' :
    step.status === 'error'   ? 'border-red-300 bg-red-50/20' :
                                'border-gray-100';

  return (
    <div
      data-error={hasAnyError ? 'true' : 'false'}
      className={cn('border rounded-2xl overflow-hidden transition-colors', statusColor, hasAnyError && 'border-red-300')}
    >
      <div className="flex flex-wrap items-start gap-3 p-3">
        {/* Step number */}
        <div className="shrink-0 w-5 pt-2 text-center">
          <span className="text-xs font-semibold text-gray-400">{index + 1}</span>
        </div>

        {/* Device */}
        <div className="w-40 shrink-0">
          <DeviceSelect
            value={step.deviceId}
            onChange={v => onChange({ ...step, deviceId: v })}
            disabled={disabled}
            conflicts={stepConflicts}
          />
          {hasDeviceError && <p className="text-[10px] text-red-500 mt-0.5">Required</p>}
        </div>

        {/* Action + Params — wrap together */}
        <div className="flex flex-wrap items-start gap-3 flex-1 min-w-[200px]">
          {/* Action */}
          <div className="w-20 shrink-0">
            <select
              value={step.action || 'On'}
              onChange={e => onChange({ ...step, action: e.target.value, params: {} })}
              disabled={disabled}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white w-full"
            >
              <option>On</option>
              <option>Pulse</option>
            </select>
          </div>

          {/* Params */}
          <div className="flex-1">
            {(step.action === 'On' || !step.action) && (
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-1.5 items-center flex-wrap">
                  <input
                    type="number"
                    min="0"
                    value={step.params?.duration || ''}
                    onChange={e => updateParam('duration', Number(e.target.value))}
                    disabled={disabled}
                    placeholder="30"
                    className={cn('border rounded-lg px-2 py-1.5 text-sm w-16 text-center', hasDurationError ? 'border-red-400' : 'border-gray-200')}
                  />
                  <select
                    value={step.params?.unit || 'min'}
                    onChange={e => updateParam('unit', e.target.value)}
                    disabled={disabled}
                    className="border border-gray-200 rounded-lg px-1.5 py-1.5 text-sm bg-white"
                  >
                    <option value="sec">sec</option>
                    <option value="min">min</option>
                    <option value="hours">h</option>
                  </select>
                </div>
                {hasDurationError && <p className="text-[10px] text-red-500">Required</p>}
              </div>
            )}
            {step.action === 'Pulse' && (
              <div className="flex gap-2 flex-wrap">
                <div className="flex flex-col items-center gap-0.5">
                  <input type="number" min="0" value={step.params?.on || ''} onChange={e => updateParam('on', Number(e.target.value))} disabled={disabled} placeholder="10"
                    className={cn('border rounded-lg px-1.5 py-1 text-sm w-14 text-center', hasPulseOnError ? 'border-red-400' : 'border-gray-200')} />
                  <span className={cn('text-[10px]', hasPulseOnError ? 'text-red-400' : 'text-gray-400')}>ON (s)</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <input type="number" min="0" value={step.params?.off || ''} onChange={e => updateParam('off', Number(e.target.value))} disabled={disabled} placeholder="30"
                    className={cn('border rounded-lg px-1.5 py-1 text-sm w-14 text-center', hasPulseOffError ? 'border-red-400' : 'border-gray-200')} />
                  <span className={cn('text-[10px]', hasPulseOffError ? 'text-red-400' : 'text-gray-400')}>OFF (s)</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <input type="number" min="0" value={step.params?.cycles || ''} onChange={e => updateParam('cycles', Number(e.target.value))} disabled={disabled} placeholder="3"
                    className={cn('border rounded-lg px-1.5 py-1 text-sm w-12 text-center', hasCyclesError ? 'border-red-400' : 'border-gray-200')} />
                  <span className={cn('text-[10px]', hasCyclesError ? 'text-red-400' : 'text-gray-400')}>CYCLES</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status + remove */}
        <div className="flex items-center gap-2 ml-auto shrink-0 pt-1">
          <StepStatusBadge status={step.status || 'pending'} />
          {!disabled && (
            <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
          )}
        </div>
      </div>
    </div>
  );
}
