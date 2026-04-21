import { cn } from '@/lib/utils.js';
import { DEVICES, SENSORS } from '@/lib/mockData.js';
import { StepStatusBadge, ConflictBanner } from '@/widgets/ui.jsx';

// Device select — shared between sensor and schedule steps
function DeviceSelect({ value, onChange, disabled, conflicts }) {
  const conflict = conflicts?.[value];
  return (
    <div className="w-full">
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'border rounded-lg px-2 py-1.5 text-sm bg-white w-full',
          conflict ? 'border-amber-300 text-amber-700' : 'border-gray-200'
        )}
      >
        <option value="">Select device…</option>
        {DEVICES.map(d => (
          <option key={d.id} value={d.id}>
            {d.name}{d.status === 'rule' ? ' (Rule)' : d.status === 'workflow' ? ' (Wf)' : ''}
          </option>
        ))}
      </select>
      {conflict && <ConflictBanner message={conflict} />}
    </div>
  );
}

// A single sensor data row within a step (FROM / CURRENT / UNTIL)
function SensorDataRow({ row, rIdx, triggerLogic, onUpdate, onRemove, disabled }) {
  const sensorInfo = SENSORS.find(s => s.id === row.sensorId);

  return (
    <div>
      {rIdx > 0 && (
        <div className="py-1">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {triggerLogic || 'AND'}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        {/* Sensor name */}
        <span className="text-sm text-gray-700 w-24 shrink-0 truncate">{sensorInfo?.name || row.sensorId}</span>

        {/* FROM */}
        <div className="flex flex-col items-center gap-0.5">
          <input
            type="number"
            value={row.from ?? ''}
            onChange={e => onUpdate(rIdx, 'from', Number(e.target.value))}
            disabled={disabled}
            className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center"
          />
          <span className="text-[10px] text-gray-400">FROM</span>
        </div>

        {/* CURRENT */}
        <div className="flex flex-col items-center gap-0.5">
          <span className={cn(
            'rounded-lg px-1.5 py-1 text-sm w-14 text-center font-medium border block',
            row.currentValue != null
              ? 'border-teal-200 bg-teal-50 text-teal-700'
              : 'border-gray-100 bg-gray-50 text-gray-300'
          )}>
            {row.currentValue != null ? row.currentValue : '–'}
          </span>
          <span className="text-[10px] text-gray-400">NOW</span>
        </div>

        {/* UNTIL */}
        <div className="flex flex-col items-center gap-0.5">
          <input
            type="number"
            value={row.until ?? ''}
            onChange={e => onUpdate(rIdx, 'until', Number(e.target.value))}
            disabled={disabled}
            className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center"
          />
          <span className="text-[10px] text-gray-400">UNTIL</span>
        </div>

        <span className="text-xs text-gray-400 shrink-0">{sensorInfo?.unit}</span>

        {/* Remove sensor row — only shown when there are multiple or if editable */}
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

export function SensorStepRow({ step, index, triggerLogic, onChange, onRemove, disabled, saveAttempted, stepConflicts }) {
  const sensorRows = step.sensorRows || [];

  const updateParam = (key, val) => onChange({ ...step, params: { ...step.params, [key]: val } });

  const updateSensorRow = (rIdx, field, val) => {
    onChange({ ...step, sensorRows: sensorRows.map((r, i) => i === rIdx ? { ...r, [field]: val } : r) });
  };

  const removeSensorRow = (rIdx) => {
    onChange({ ...step, sensorRows: sensorRows.filter((_, i) => i !== rIdx) });
  };

  const hasDeviceError = saveAttempted && !step.deviceId;

  const statusColor =
    step.status === 'running' ? 'border-blue-400 bg-blue-50/30' :
    step.status === 'done'    ? 'border-green-300' :
    step.status === 'error'   ? 'border-red-300 bg-red-50/20' :
    step.status === 'waiting' ? 'border-amber-300 bg-amber-50/20' :
                                'border-gray-100';

  return (
    <div
      data-error={hasDeviceError ? 'true' : 'false'}
      className={cn('border rounded-2xl overflow-hidden transition-colors', statusColor, hasDeviceError && 'border-red-400')}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-3">
        {/* Step number */}
        <div className="shrink-0 w-5 pt-2 text-center">
          <span className="text-xs font-semibold text-gray-400">{index + 1}</span>
        </div>

        {/* Device */}
        <div className="w-36 shrink-0">
          <DeviceSelect
            value={step.deviceId}
            onChange={v => onChange({ ...step, deviceId: v })}
            disabled={disabled}
            conflicts={stepConflicts}
          />
          {hasDeviceError && <p className="text-[10px] text-red-500 mt-0.5">Required</p>}
        </div>

        {/* Sensor rows with FROM/CURRENT/UNTIL */}
        <div className="flex-1 min-w-0 space-y-1">
          {sensorRows.length === 0 && (
            <span className="text-xs text-gray-400 italic">No sensors — add from trigger</span>
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
            />
          ))}
        </div>

        {/* Action type */}
        <div className="w-32 shrink-0">
          <select
            value={step.actionType || 'Regular'}
            onChange={e => onChange({ ...step, actionType: e.target.value, params: {} })}
            disabled={disabled}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white w-full"
          >
            <option>Regular</option>
            <option>Stepper Motor</option>
            <option>Loop</option>
          </select>
        </div>

        {/* Params */}
        <div className="w-36 shrink-0">
          {step.actionType === 'Stepper Motor' && (
            <div className="flex gap-2">
              <div className="flex flex-col items-center gap-0.5">
                <input type="text" placeholder="00:00" value={step.params?.run || ''} onChange={e => updateParam('run', e.target.value)} disabled={disabled}
                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-16 text-center" />
                <span className="text-[10px] text-gray-400">RUN (S)</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <input type="text" placeholder="00:00" value={step.params?.wait || ''} onChange={e => updateParam('wait', e.target.value)} disabled={disabled}
                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-16 text-center" />
                <span className="text-[10px] text-gray-400">WAIT (S)</span>
              </div>
            </div>
          )}
          {step.actionType === 'Loop' && (
            <div className="flex gap-1.5">
              <div className="flex flex-col items-center gap-0.5">
                <input type="number" value={step.params?.times || ''} onChange={e => updateParam('times', Number(e.target.value))} disabled={disabled}
                  className="border border-gray-200 rounded-lg px-1 py-1 text-sm w-12 text-center" />
                <span className="text-[10px] text-gray-400">TIMES</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <input type="text" placeholder="00:00" value={step.params?.on || ''} onChange={e => updateParam('on', e.target.value)} disabled={disabled}
                  className="border border-gray-200 rounded-lg px-1 py-1 text-sm w-14 text-center" />
                <span className="text-[10px] text-gray-400">ON (S)</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <input type="text" placeholder="00:00" value={step.params?.off || ''} onChange={e => updateParam('off', e.target.value)} disabled={disabled}
                  className="border border-gray-200 rounded-lg px-1 py-1 text-sm w-14 text-center" />
                <span className="text-[10px] text-gray-400">OFF (S)</span>
              </div>
            </div>
          )}
          {step.actionType === 'Regular' && (
            <span className="text-sm text-gray-300">–</span>
          )}
        </div>

        {/* Status */}
        <div className="w-16 shrink-0 text-right pt-1.5">
          <StepStatusBadge status={step.status || 'pending'} />
        </div>

        {/* Remove step */}
        {!disabled && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0 pt-1">×</button>
        )}
      </div>
    </div>
  );
}

export function ScheduleStepRow({ step, index, onChange, onRemove, disabled, saveAttempted, stepConflicts }) {
  const updateParam = (key, val) => onChange({ ...step, params: { ...step.params, [key]: val } });
  const hasDeviceError = saveAttempted && !step.deviceId;
  const hasDurationError = saveAttempted && (step.action === 'On' || !step.action) && !step.params?.duration;

  const statusColor =
    step.status === 'running' ? 'border-blue-400 bg-blue-50/30' :
    step.status === 'done'    ? 'border-green-300' :
    step.status === 'error'   ? 'border-red-300 bg-red-50/20' :
                                'border-gray-100';

  return (
    <div
      data-error={(hasDeviceError || hasDurationError) ? 'true' : 'false'}
      className={cn('border rounded-2xl overflow-hidden transition-colors', statusColor, (hasDeviceError || hasDurationError) && 'border-red-300')}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Step number */}
        <div className="shrink-0 w-5 pt-2 text-center">
          <span className="text-xs font-semibold text-gray-400">{index + 1}</span>
        </div>

        {/* Device */}
        <div className="w-36 shrink-0">
          <DeviceSelect
            value={step.deviceId}
            onChange={v => onChange({ ...step, deviceId: v })}
            disabled={disabled}
            conflicts={stepConflicts}
          />
          {hasDeviceError && <p className="text-[10px] text-red-500 mt-0.5">Required</p>}
        </div>

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
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
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
            <div className="flex gap-2">
              <div className="flex flex-col items-center gap-0.5">
                <input type="number" value={step.params?.on || ''} onChange={e => updateParam('on', Number(e.target.value))} disabled={disabled} placeholder="10"
                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" />
                <span className="text-[10px] text-gray-400">ON (s)</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <input type="number" value={step.params?.off || ''} onChange={e => updateParam('off', Number(e.target.value))} disabled={disabled} placeholder="30"
                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" />
                <span className="text-[10px] text-gray-400">OFF (s)</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <input type="number" value={step.params?.cycles || ''} onChange={e => updateParam('cycles', Number(e.target.value))} disabled={disabled} placeholder="3"
                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-12 text-center" />
                <span className="text-[10px] text-gray-400">CYCLES</span>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="w-16 shrink-0 text-right pt-1.5">
          <StepStatusBadge status={step.status || 'pending'} />
        </div>

        {!disabled && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0 pt-1">×</button>
        )}
      </div>
    </div>
  );
}
