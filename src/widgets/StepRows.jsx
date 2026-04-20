import { cn } from '@/lib/utils.js';
import { DEVICES, SENSORS } from '@/lib/mockData.js';
import { StepStatusBadge, ConflictBanner } from '@/widgets/ui.jsx';

function DeviceSelect({ value, onChange, disabled, conflicts }) {
  const conflict = conflicts?.[value];
  return (
    <div className="w-full md:w-36 shrink-0">
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'border rounded-lg px-2 py-1.5 text-sm bg-white w-full',
          conflict ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200'
        )}
      >
        <option value="">Select device...</option>
        {DEVICES.map(d => (
          <option key={d.id} value={d.id}>
            {d.name}{d.status === 'rule' ? ' (Rule)' : d.status === 'workflow' ? ' (Workflow)' : ''}
          </option>
        ))}
      </select>
      {conflict && <ConflictBanner message={conflict} />}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <span className="md:hidden text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-0.5">
      {children}
    </span>
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

  const statusColor = {
    running: 'border-blue-300 bg-blue-50/20',
    error: 'border-red-200 bg-red-50/40',
    done: 'border-green-200 bg-green-50/10',
    waiting: 'border-amber-200 bg-amber-50/20',
  }[step.status] || 'border-gray-100 bg-white';

  return (
    <div className={cn('border rounded-2xl p-3 transition-colors', statusColor, hasDeviceError && 'border-red-400')}>
      {/* Mobile: stacked layout */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">#{index + 1}</span>
            <StepStatusBadge status={step.status || 'pending'} />
          </div>
          {!disabled && (
            <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-xl leading-none px-1">×</button>
          )}
        </div>

        <div>
          <FieldLabel>Device</FieldLabel>
          <DeviceSelect
            value={step.deviceId}
            onChange={v => onChange({ ...step, deviceId: v })}
            disabled={disabled}
            conflicts={stepConflicts}
          />
          {hasDeviceError && <p className="text-xs text-red-500 mt-1">Device is required</p>}
        </div>

        {sensorRows.map((row, rIdx) => {
          const sensorInfo = SENSORS.find(s => s.id === row.sensorId);
          return (
            <div key={rIdx} className="space-y-1.5">
              {rIdx > 0 && (
                <span className="inline-block text-xs font-bold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded">
                  {triggerLogic || 'AND'}
                </span>
              )}
              <FieldLabel>Sensor</FieldLabel>
              <p className="text-sm font-medium text-gray-700">{sensorInfo?.name}</p>
              <div className="flex gap-2">
                <div>
                  <FieldLabel>From</FieldLabel>
                  <input type="number" value={row.from} onChange={e => updateSensorRow(rIdx, 'from', Number(e.target.value))} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 text-center" />
                </div>
                <div>
                  <FieldLabel>Current</FieldLabel>
                  <span className={cn('inline-flex items-center justify-center border rounded-lg px-2 py-1 text-sm w-16 text-center font-medium', row.currentValue != null ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-gray-100 bg-gray-50 text-gray-300')}>
                    {row.currentValue != null ? row.currentValue : '--'}
                  </span>
                </div>
                <div>
                  <FieldLabel>Until</FieldLabel>
                  <input type="number" value={row.until} onChange={e => updateSensorRow(rIdx, 'until', Number(e.target.value))} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 text-center" />
                </div>
              </div>
            </div>
          );
        })}

        <div>
          <FieldLabel>Action Type</FieldLabel>
          <select
            value={step.actionType || 'Regular'}
            onChange={e => onChange({ ...step, actionType: e.target.value })}
            disabled={disabled}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white w-full max-w-[180px]"
          >
            <option>Regular</option>
            <option>Stepper Motor</option>
            <option>Loop</option>
          </select>
        </div>

        {step.actionType === 'Stepper Motor' && (
          <div>
            <FieldLabel>Params</FieldLabel>
            <div className="flex gap-2">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">RUN (S)</p>
                <input type="text" placeholder="00:00" value={step.params?.run || ''} onChange={e => updateParam('run', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-20 text-center" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">WAIT (S)</p>
                <input type="text" placeholder="00:00" value={step.params?.wait || ''} onChange={e => updateParam('wait', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-20 text-center" />
              </div>
            </div>
          </div>
        )}
        {step.actionType === 'Loop' && (
          <div>
            <FieldLabel>Params</FieldLabel>
            <div className="flex gap-2">
              <div><p className="text-[10px] text-gray-400 mb-0.5">TIMES</p><input type="number" value={step.params?.times || ''} onChange={e => updateParam('times', Number(e.target.value))} disabled={disabled} className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" /></div>
              <div><p className="text-[10px] text-gray-400 mb-0.5">ON (S)</p><input type="text" placeholder="00:00" value={step.params?.on || ''} onChange={e => updateParam('on', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-16 text-center" /></div>
              <div><p className="text-[10px] text-gray-400 mb-0.5">OFF (S)</p><input type="text" placeholder="00:00" value={step.params?.off || ''} onChange={e => updateParam('off', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-16 text-center" /></div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: horizontal layout */}
      <div className="hidden md:flex items-start gap-3">
        {/* Index */}
        <div className="w-8 shrink-0 flex items-center gap-1 mt-2 text-gray-300">
          <span className="text-xs cursor-grab select-none">⠿</span>
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
          {hasDeviceError && <p className="text-xs text-red-500 mt-1">Required</p>}
        </div>

        {/* Sensor rows */}
        <div className="flex-1 min-w-0 space-y-1">
          {sensorRows.map((row, rIdx) => {
            const sensorInfo = SENSORS.find(s => s.id === row.sensorId);
            return (
              <div key={rIdx}>
                {rIdx > 0 && (
                  <span className="inline-block text-[10px] font-bold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded mb-1">
                    {triggerLogic || 'AND'}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-24 text-sm text-gray-700 truncate">{sensorInfo?.name}</span>
                  <input type="number" value={row.from} onChange={e => updateSensorRow(rIdx, 'from', Number(e.target.value))} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 text-center" />
                  <span className={cn('inline-flex items-center justify-center border rounded-lg px-2 py-1 text-sm w-16 text-center font-medium', row.currentValue != null ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-gray-100 bg-gray-50 text-gray-300')}>
                    {row.currentValue != null ? row.currentValue : '--'}
                  </span>
                  <input type="number" value={row.until} onChange={e => updateSensorRow(rIdx, 'until', Number(e.target.value))} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-16 text-center" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action type */}
        <div className="flex-1 min-w-[110px] max-w-[140px]">
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
        <div className="w-32 shrink-0">
          {step.actionType === 'Stepper Motor' && (
            <div className="space-y-1">
              <div className="flex gap-1">
                <div className="flex-1">
                  <input type="text" placeholder="00:00" value={step.params?.run || ''} onChange={e => updateParam('run', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-full text-center" />
                  <p className="text-[10px] text-gray-400 text-center mt-0.5">RUN (S)</p>
                </div>
                <div className="flex-1">
                  <input type="text" placeholder="00:00" value={step.params?.wait || ''} onChange={e => updateParam('wait', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-full text-center" />
                  <p className="text-[10px] text-gray-400 text-center mt-0.5">WAIT (S)</p>
                </div>
              </div>
            </div>
          )}
          {step.actionType === 'Loop' && (
            <div className="space-y-1">
              <div className="flex gap-1">
                <div>
                  <input type="number" value={step.params?.times || ''} onChange={e => updateParam('times', Number(e.target.value))} disabled={disabled} className="border border-gray-200 rounded-lg px-1 py-1 text-sm w-10 text-center" />
                  <p className="text-[10px] text-gray-400 text-center mt-0.5">×</p>
                </div>
                <div>
                  <input type="text" placeholder="00:00" value={step.params?.on || ''} onChange={e => updateParam('on', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-1 py-1 text-sm w-14 text-center" />
                  <p className="text-[10px] text-gray-400 text-center mt-0.5">ON</p>
                </div>
                <div>
                  <input type="text" placeholder="00:00" value={step.params?.off || ''} onChange={e => updateParam('off', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-1 py-1 text-sm w-14 text-center" />
                  <p className="text-[10px] text-gray-400 text-center mt-0.5">OFF</p>
                </div>
              </div>
            </div>
          )}
          {step.actionType === 'Regular' && (
            <span className="text-gray-300 text-xs">–</span>
          )}
        </div>

        {/* Status */}
        <div className="w-16 shrink-0 text-right mt-1">
          <StepStatusBadge status={step.status || 'pending'} />
        </div>

        {/* Remove */}
        {!disabled && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 shrink-0 mt-1 text-xl leading-none px-0.5">×</button>
        )}
      </div>
    </div>
  );
}

export function ScheduleStepRow({ step, index, onChange, onRemove, disabled, saveAttempted, stepConflicts }) {
  const updateParam = (key, val) => onChange({ ...step, params: { ...step.params, [key]: val } });
  const hasDeviceError = saveAttempted && !step.deviceId;
  const hasDurationError = saveAttempted && step.action === 'On' && !step.params?.duration;

  const statusColor = {
    running: 'border-blue-300 bg-blue-50/20',
    error: 'border-red-200 bg-red-50/40',
    done: 'border-green-200 bg-green-50/10',
  }[step.status] || 'border-gray-100 bg-white';

  return (
    <div className={cn('border rounded-2xl p-3 transition-colors', statusColor, hasDeviceError && 'border-red-400')}>
      {/* Mobile layout */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">#{index + 1}</span>
            <StepStatusBadge status={step.status || 'pending'} />
          </div>
          {!disabled && (
            <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-xl leading-none px-1">×</button>
          )}
        </div>
        <div>
          <FieldLabel>Device</FieldLabel>
          <DeviceSelect value={step.deviceId} onChange={v => onChange({ ...step, deviceId: v })} disabled={disabled} conflicts={stepConflicts} />
          {hasDeviceError && <p className="text-xs text-red-500 mt-1">Device is required</p>}
        </div>
        <div>
          <FieldLabel>Action</FieldLabel>
          <select value={step.action || 'On'} onChange={e => onChange({ ...step, action: e.target.value, params: {} })} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white">
            <option>On</option>
            <option>Pulse</option>
          </select>
        </div>
        {step.action === 'On' && (
          <div>
            <FieldLabel>Duration</FieldLabel>
            <div className="flex gap-2 items-center">
              <input type="number" value={step.params?.duration || ''} onChange={e => updateParam('duration', Number(e.target.value))} disabled={disabled} placeholder="30" className={cn('border rounded-lg px-2 py-1 text-sm w-20 text-center', hasDurationError ? 'border-red-400' : 'border-gray-200')} />
              <select value={step.params?.unit || 'min'} onChange={e => updateParam('unit', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white">
                <option value="sec">sec</option>
                <option value="min">min</option>
                <option value="hours">hours</option>
              </select>
            </div>
            {hasDurationError && <p className="text-xs text-red-500 mt-1">Duration required</p>}
          </div>
        )}
        {step.action === 'Pulse' && (
          <div>
            <FieldLabel>Params</FieldLabel>
            <div className="flex gap-2">
              <div><p className="text-[10px] text-gray-400 mb-0.5">ON (S)</p><input type="number" value={step.params?.on || ''} onChange={e => updateParam('on', Number(e.target.value))} disabled={disabled} placeholder="10" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" /></div>
              <div><p className="text-[10px] text-gray-400 mb-0.5">OFF (S)</p><input type="number" value={step.params?.off || ''} onChange={e => updateParam('off', Number(e.target.value))} disabled={disabled} placeholder="30" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" /></div>
              <div><p className="text-[10px] text-gray-400 mb-0.5">CYCLES</p><input type="number" value={step.params?.cycles || ''} onChange={e => updateParam('cycles', Number(e.target.value))} disabled={disabled} placeholder="3" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" /></div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-3">
        <div className="w-8 shrink-0 flex items-center gap-1 text-gray-300">
          <span className="text-xs cursor-grab select-none">⠿</span>
          <span className="text-xs font-semibold text-gray-400">{index + 1}</span>
        </div>

        <div className="w-36 shrink-0">
          <DeviceSelect value={step.deviceId} onChange={v => onChange({ ...step, deviceId: v })} disabled={disabled} conflicts={stepConflicts} />
          {hasDeviceError && <p className="text-xs text-red-500 mt-1">Required</p>}
        </div>

        <div className="w-20 shrink-0">
          <select value={step.action || 'On'} onChange={e => onChange({ ...step, action: e.target.value, params: {} })} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white w-full">
            <option>On</option>
            <option>Pulse</option>
          </select>
        </div>

        <div className="flex-1 min-w-0">
          {step.action === 'On' && (
            <div>
              <div className="flex gap-2 items-center">
                <input type="number" value={step.params?.duration || ''} onChange={e => updateParam('duration', Number(e.target.value))} disabled={disabled} placeholder="30" className={cn('border rounded-lg px-2 py-1 text-sm w-20 text-center', hasDurationError ? 'border-red-400' : 'border-gray-200')} />
                <select value={step.params?.unit || 'min'} onChange={e => updateParam('unit', e.target.value)} disabled={disabled} className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white">
                  <option value="sec">sec</option>
                  <option value="min">min</option>
                  <option value="hours">hours</option>
                </select>
              </div>
              {hasDurationError && <p className="text-xs text-red-500 mt-1">Duration required</p>}
            </div>
          )}
          {step.action === 'Pulse' && (
            <div className="flex gap-2 items-end">
              <div>
                <input type="number" value={step.params?.on || ''} onChange={e => updateParam('on', Number(e.target.value))} disabled={disabled} placeholder="10" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-16 text-center" />
                <p className="text-[10px] text-gray-400 text-center mt-0.5">ON (S)</p>
              </div>
              <div>
                <input type="number" value={step.params?.off || ''} onChange={e => updateParam('off', Number(e.target.value))} disabled={disabled} placeholder="30" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-16 text-center" />
                <p className="text-[10px] text-gray-400 text-center mt-0.5">OFF (S)</p>
              </div>
              <div>
                <input type="number" value={step.params?.cycles || ''} onChange={e => updateParam('cycles', Number(e.target.value))} disabled={disabled} placeholder="3" className="border border-gray-200 rounded-lg px-1.5 py-1 text-sm w-14 text-center" />
                <p className="text-[10px] text-gray-400 text-center mt-0.5">CYCLES</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-16 shrink-0 text-right">
          <StepStatusBadge status={step.status || 'pending'} />
        </div>

        {!disabled && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 shrink-0 text-xl leading-none px-0.5">×</button>
        )}
      </div>
    </div>
  );
}
