import { cn } from '@/lib/utils.js';
import { DEVICES, SENSORS } from '@/lib/mockData.js';
import { StepStatusBadge, ConflictBanner } from '@/widgets/ui.jsx';

function DeviceSelect({ value, onChange, disabled, conflicts }) {
  const conflict = conflicts?.[value];
  return (
    <div className="min-w-[140px]">
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'border rounded-lg px-2 py-1.5 text-sm bg-white w-full',
          conflict ? 'border-amber-300 text-amber-700' : 'border-gray-200'
        )}
      >
        <option value="">Select device...</option>
        {DEVICES.map(d => (
          <option
            key={d.id}
            value={d.id}
            className={d.status !== 'free' ? 'text-amber-600' : ''}
          >
            {d.name}{d.status === 'rule' ? ' • (Rule)' : d.status === 'workflow' ? ' • (Workflow)' : ''}
          </option>
        ))}
      </select>
      {conflict && (
        <ConflictBanner message={conflict} />
      )}
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

  const hasError = saveAttempted && !step.deviceId;

  return (
    <div className={cn(
      'border rounded-2xl p-3 mb-2 transition-colors',
      step.status === 'error' ? 'border-red-200 bg-red-50/30' :
      step.status === 'running' ? 'border-blue-300 bg-blue-50/20' :
      step.status === 'done' ? 'border-gray-100' : 'border-gray-100',
      hasError && 'border-red-400'
    )}>
      <div className="flex items-start gap-3">
        {/* Drag handle + number */}
        <div className="flex items-center gap-1 mt-1.5 shrink-0 text-gray-300">
          <span className="text-xs cursor-grab">⠿</span>
          <span className="text-xs font-medium text-gray-400">{index + 1}</span>
        </div>

        {/* Device */}
        <DeviceSelect
          value={step.deviceId}
          onChange={v => onChange({ ...step, deviceId: v })}
          disabled={disabled}
          conflicts={stepConflicts}
        />

        {/* Sensor rows */}
        <div className="flex-1 min-w-0">
          {sensorRows.map((row, rIdx) => {
            const sensorInfo = SENSORS.find(s => s.id === row.sensorId);
            return (
              <div key={rIdx}>
                {rIdx > 0 && (
                  <div className="text-xs font-semibold text-blue-600 py-1">{triggerLogic || 'AND'}</div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-700 min-w-[90px]">{sensorInfo?.name}</span>
                  <input
                    type="number"
                    value={row.from}
                    onChange={e => updateSensorRow(rIdx, 'from', Number(e.target.value))}
                    disabled={disabled}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 text-center"
                  />
                  {row.currentValue != null && (
                    <span className="border border-teal-200 bg-teal-50 text-teal-700 rounded-lg px-2 py-1 text-sm w-16 text-center font-medium">
                      {row.currentValue}
                    </span>
                  )}
                  {row.currentValue == null && (
                    <span className="border border-gray-100 bg-gray-50 text-gray-300 rounded-lg px-2 py-1 text-sm w-16 text-center">--</span>
                  )}
                  <input
                    type="number"
                    value={row.until}
                    onChange={e => updateSensorRow(rIdx, 'until', Number(e.target.value))}
                    disabled={disabled}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 text-center"
                  />
                  <button className="text-gray-300 hover:text-gray-500 text-sm">×</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action type */}
        <div className="min-w-[120px] shrink-0">
          <select
            value={step.actionType || 'Regular'}
            onChange={e => onChange({ ...step, actionType: e.target.value })}
            disabled={disabled}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white w-full"
          >
            <option>Regular</option>
            <option>Stepper Motor</option>
            <option>Loop</option>
          </select>
        </div>

        {/* Params */}
        <div className="shrink-0 text-sm text-gray-500">
          {step.actionType === 'Stepper Motor' && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="00:00"
                  value={step.params?.run || ''}
                  onChange={e => updateParam('run', e.target.value)}
                  disabled={disabled}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 text-center"
                />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="00:00"
                  value={step.params?.wait || ''}
                  onChange={e => updateParam('wait', e.target.value)}
                  disabled={disabled}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 text-center"
                />
              </div>
              <div className="flex gap-1 text-xs text-gray-400">
                <span className="w-16 text-center">RUN (S)</span>
              </div>
              <div className="flex gap-1 text-xs text-gray-400">
                <span className="w-16 text-center">WAIT (S)</span>
              </div>
            </div>
          )}
          {step.actionType === 'Loop' && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <input type="number" value={step.params?.times || ''} onChange={e => updateParam('times', Number(e.target.value))} disabled={disabled} className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-12 text-center" />
                <input type="text" placeholder="00:00" value={step.params?.on || ''} onChange={e => updateParam('on', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-16 text-center" />
                <input type="text" placeholder="00:00" value={step.params?.off || ''} onChange={e => updateParam('off', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-16 text-center" />
              </div>
              <div className="flex gap-1 text-xs text-gray-400">
                <span className="w-12 text-center">TIMES</span>
                <span className="w-16 text-center">ON (S)</span>
                <span className="w-16 text-center">OFF (S)</span>
              </div>
            </div>
          )}
          {step.actionType === 'Regular' && (
            <span className="text-gray-400 text-xs">–</span>
          )}
        </div>

        {/* Status */}
        <div className="shrink-0 min-w-[60px] text-right">
          <StepStatusBadge status={step.status || 'pending'} />
        </div>

        {/* Remove */}
        {!disabled && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 shrink-0 mt-1 text-lg leading-none">×</button>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-500 mt-1 ml-8">Device is required</p>
      )}
    </div>
  );
}

export function ScheduleStepRow({ step, index, onChange, onRemove, disabled, saveAttempted, stepConflicts }) {
  const updateParam = (key, val) => onChange({ ...step, params: { ...step.params, [key]: val } });
  const hasError = saveAttempted && !step.deviceId;

  return (
    <div className={cn(
      'border rounded-2xl mb-2',
      step.status === 'error' ? 'border-red-200 bg-red-50/30' :
      step.status === 'done' ? 'border-gray-100' : 'border-blue-200 bg-blue-50/10',
      hasError && 'border-red-400'
    )}>
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="flex items-center gap-1 shrink-0 text-gray-300">
          <span className="text-xs cursor-grab">⠿</span>
          <span className="text-xs font-medium text-gray-400">{index + 1}</span>
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
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
        >
          <option>On</option>
          <option>Pulse</option>
        </select>

        {/* Params */}
        <div className="flex items-end gap-2 text-sm">
          {step.action === 'On' && (
            <div className="flex flex-col gap-0.5">
              <div className="flex gap-1">
                <input
                  type="number"
                  value={step.params?.duration || ''}
                  onChange={e => updateParam('duration', Number(e.target.value))}
                  disabled={disabled}
                  placeholder="30"
                  className={cn(
                    'border rounded-lg px-2 py-1 text-sm w-16 text-center',
                    saveAttempted && !step.params?.duration ? 'border-red-400' : 'border-gray-200'
                  )}
                />
                <select
                  value={step.params?.unit || 'min'}
                  onChange={e => updateParam('unit', e.target.value)}
                  disabled={disabled}
                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm bg-white"
                >
                  <option value="sec">sec</option>
                  <option value="min">min</option>
                  <option value="hours">hours</option>
                </select>
              </div>
              {saveAttempted && !step.params?.duration && (
                <p className="text-xs text-red-500">Duration is required</p>
              )}
            </div>
          )}
          {step.action === 'Pulse' && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <input type="number" value={step.params?.on || ''} onChange={e => updateParam('on', Number(e.target.value))} disabled={disabled} placeholder="10" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" />
                <input type="number" value={step.params?.off || ''} onChange={e => updateParam('off', Number(e.target.value))} disabled={disabled} placeholder="30" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" />
                <input type="number" value={step.params?.cycles || ''} onChange={e => updateParam('cycles', Number(e.target.value))} disabled={disabled} placeholder="3" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-12 text-center" />
              </div>
              <div className="flex gap-1 text-xs text-gray-400">
                <span className="w-14 text-center">ON (S)</span>
                <span className="w-14 text-center">OFF (S)</span>
                <span className="w-12 text-center">CYCLES</span>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="ml-auto shrink-0">
          <StepStatusBadge status={step.status || 'pending'} />
        </div>

        {!disabled && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 shrink-0 text-lg leading-none">×</button>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-500 px-8 pb-2">Device is required</p>
      )}
    </div>
  );
}
