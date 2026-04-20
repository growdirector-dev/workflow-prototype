import { cn } from '@/lib/utils.js';
import { DEVICES, SENSORS } from '@/lib/mockData.js';
import { StepStatusBadge, ConflictBanner } from '@/widgets/ui.jsx';

function DeviceSelect({ value, onChange, disabled, conflicts }) {
  const conflict = conflicts?.[value];
  return (
    <div className="min-w-0 flex-shrink-0 w-36">
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

export function SensorStepRow({ step, index, triggerLogic, onChange, onRemove, disabled, saveAttempted, stepConflicts }) {
  const sensorRows = step.sensorRows || [];

  const updateParam = (key, val) => onChange({ ...step, params: { ...step.params, [key]: val } });

  const updateSensorRow = (idx, field, val) => {
    const next = sensorRows.map((r, i) => i === idx ? { ...r, [field]: val } : r);
    onChange({ ...step, sensorRows: next });
  };

  const hasDeviceError = saveAttempted && !step.deviceId;

  const statusColor = step.status === 'running' ? 'border-blue-300 bg-blue-50/20'
    : step.status === 'error' ? 'border-red-200 bg-red-50/30'
    : step.status === 'done' ? 'border-green-200'
    : 'border-gray-100';

  return (
    <div className={cn('border rounded-2xl p-3 transition-colors', statusColor, hasDeviceError && 'border-red-400')}>
      {/* Header row: index + device + action type + remove */}
      <div className="flex items-start gap-2 flex-wrap">
        {/* Number */}
        <div className="flex items-center gap-1 shrink-0 pt-1.5 text-gray-300 w-6">
          <span className="text-xs font-semibold text-gray-400">{index + 1}</span>
        </div>

        {/* Device select */}
        <DeviceSelect
          value={step.deviceId}
          onChange={v => onChange({ ...step, deviceId: v })}
          disabled={disabled}
          conflicts={stepConflicts}
        />

        {/* Action type */}
        <select
          value={step.actionType || 'Regular'}
          onChange={e => onChange({ ...step, actionType: e.target.value, params: {} })}
          disabled={disabled}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white shrink-0"
        >
          <option>Regular</option>
          <option>Stepper Motor</option>
          <option>Loop</option>
        </select>

        {/* Status */}
        <div className="ml-auto shrink-0 pt-1">
          <StepStatusBadge status={step.status || 'pending'} />
        </div>

        {/* Remove */}
        {!disabled && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 shrink-0 pt-1 text-xl leading-none">×</button>
        )}
      </div>

      {hasDeviceError && <p className="text-xs text-red-500 mt-1 pl-7">Device is required</p>}

      {/* Action params row */}
      {step.actionType !== 'Regular' && (
        <div className="mt-2 pl-7">
          {step.actionType === 'Stepper Motor' && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <input
                  type="text" placeholder="00:00"
                  value={step.params?.run || ''}
                  onChange={e => updateParam('run', e.target.value)}
                  disabled={disabled}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-20 text-center"
                />
                <span className="text-[10px] text-gray-400 text-center">RUN (S)</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <input
                  type="text" placeholder="00:00"
                  value={step.params?.wait || ''}
                  onChange={e => updateParam('wait', e.target.value)}
                  disabled={disabled}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-20 text-center"
                />
                <span className="text-[10px] text-gray-400 text-center">WAIT (S)</span>
              </div>
            </div>
          )}
          {step.actionType === 'Loop' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <input type="number" value={step.params?.times || ''} onChange={e => updateParam('times', Number(e.target.value))} disabled={disabled} className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" />
                <span className="text-[10px] text-gray-400 text-center">TIMES</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <input type="text" placeholder="00:00" value={step.params?.on || ''} onChange={e => updateParam('on', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-20 text-center" />
                <span className="text-[10px] text-gray-400 text-center">ON (S)</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <input type="text" placeholder="00:00" value={step.params?.off || ''} onChange={e => updateParam('off', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-20 text-center" />
                <span className="text-[10px] text-gray-400 text-center">OFF (S)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sensor rows */}
      {sensorRows.length > 0 && (
        <div className="mt-2 pl-7 space-y-1">
          {sensorRows.map((row, rIdx) => {
            const sensorInfo = SENSORS.find(s => s.id === row.sensorId);
            return (
              <div key={rIdx}>
                {rIdx > 0 && (
                  <div className="text-xs font-bold text-blue-600 py-0.5">{triggerLogic || 'AND'}</div>
                )}
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="text-gray-500 min-w-[80px] text-xs">{sensorInfo?.name}</span>
                  <div className="flex flex-col gap-0.5 items-center">
                    <input
                      type="number" value={row.from}
                      onChange={e => updateSensorRow(rIdx, 'from', Number(e.target.value))}
                      disabled={disabled}
                      className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs w-14 text-center"
                    />
                    <span className="text-[10px] text-gray-400">FROM</span>
                  </div>
                  <div className="flex flex-col gap-0.5 items-center">
                    <span className={cn(
                      'rounded-lg px-1.5 py-1 text-xs w-14 text-center font-medium border',
                      row.currentValue != null ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-gray-100 bg-gray-50 text-gray-300'
                    )}>
                      {row.currentValue != null ? row.currentValue : '–'}
                    </span>
                    <span className="text-[10px] text-gray-400">NOW</span>
                  </div>
                  <div className="flex flex-col gap-0.5 items-center">
                    <input
                      type="number" value={row.until}
                      onChange={e => updateSensorRow(rIdx, 'until', Number(e.target.value))}
                      disabled={disabled}
                      className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs w-14 text-center"
                    />
                    <span className="text-[10px] text-gray-400">UNTIL</span>
                  </div>
                  <span className="text-xs text-gray-400">{sensorInfo?.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ScheduleStepRow({ step, index, onChange, onRemove, disabled, saveAttempted, stepConflicts }) {
  const updateParam = (key, val) => onChange({ ...step, params: { ...step.params, [key]: val } });
  const hasDeviceError = saveAttempted && !step.deviceId;
  const hasDurationError = saveAttempted && step.action === 'On' && !step.params?.duration;

  const statusColor = step.status === 'running' ? 'border-blue-300 bg-blue-50/20'
    : step.status === 'error' ? 'border-red-200 bg-red-50/30'
    : step.status === 'done' ? 'border-green-200'
    : 'border-gray-100';

  return (
    <div className={cn('border rounded-2xl p-3 transition-colors', statusColor, (hasDeviceError || hasDurationError) && 'border-red-300')}>
      <div className="flex items-start gap-2 flex-wrap">
        {/* Number */}
        <div className="shrink-0 pt-1.5 w-6">
          <span className="text-xs font-semibold text-gray-400">{index + 1}</span>
        </div>

        {/* Device */}
        <DeviceSelect
          value={step.deviceId}
          onChange={v => onChange({ ...step, deviceId: v })}
          disabled={disabled}
          conflicts={stepConflicts}
        />

        {/* Action */}
        <select
          value={step.action || 'On'}
          onChange={e => onChange({ ...step, action: e.target.value, params: {} })}
          disabled={disabled}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white shrink-0"
        >
          <option>On</option>
          <option>Pulse</option>
        </select>

        {/* Params */}
        <div className="flex items-start gap-2 flex-wrap">
          {(step.action === 'On' || !step.action) && (
            <div className="flex flex-col gap-0.5">
              <div className="flex gap-1">
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
              {hasDurationError && <p className="text-xs text-red-500">Required</p>}
            </div>
          )}
          {step.action === 'Pulse' && (
            <div className="flex gap-1 flex-wrap">
              <div className="flex flex-col gap-0.5 items-center">
                <input type="number" value={step.params?.on || ''} onChange={e => updateParam('on', Number(e.target.value))} disabled={disabled} placeholder="10" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" />
                <span className="text-[10px] text-gray-400">ON (s)</span>
              </div>
              <div className="flex flex-col gap-0.5 items-center">
                <input type="number" value={step.params?.off || ''} onChange={e => updateParam('off', Number(e.target.value))} disabled={disabled} placeholder="30" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" />
                <span className="text-[10px] text-gray-400">OFF (s)</span>
              </div>
              <div className="flex flex-col gap-0.5 items-center">
                <input type="number" value={step.params?.cycles || ''} onChange={e => updateParam('cycles', Number(e.target.value))} disabled={disabled} placeholder="3" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-12 text-center" />
                <span className="text-[10px] text-gray-400">CYCLES</span>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="ml-auto shrink-0 pt-1">
          <StepStatusBadge status={step.status || 'pending'} />
        </div>

        {!disabled && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 shrink-0 pt-1 text-xl leading-none">×</button>
        )}
      </div>
      {hasDeviceError && <p className="text-xs text-red-500 mt-1 pl-7">Device is required</p>}
    </div>
  );
}
