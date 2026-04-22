import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils.js';
import { DEVICES } from '@/lib/mockData.js';
import { Toggle, StatusBadge, ConfirmDialog, AlertBanner } from '@/widgets/ui.jsx';
import { TriggerSection } from '@/widgets/TriggerSection.jsx';
import { ActiveHoursSection } from '@/widgets/ActiveHoursSection.jsx';
import { NotificationsSection } from '@/widgets/NotificationsSection.jsx';
import { SensorStepRow, ScheduleStepRow } from '@/widgets/StepRows.jsx';

function generateId() {
  return 'step_' + Math.random().toString(36).slice(2, 8);
}

function createNewSensorStep(triggerSensors) {
  return {
    id: generateId(),
    deviceId: '',
    actionType: 'Regular',
    sensorRows: (triggerSensors || []).map(s => ({
      sensorId: s.sensorId,
      from: s.value,
      currentValue: null,
      until: '',
    })),
    params: {},
    status: 'pending',
  };
}

function createNewScheduleStep() {
  return {
    id: generateId(),
    deviceId: '',
    action: 'On',
    params: { duration: '', unit: 'min' },
    status: 'pending',
  };
}

function validateWorkflow(wf) {
  const errors = [];
  if (!wf.name?.trim()) errors.push('name');
  if (wf.trigger.type === 'sensor' && (!wf.trigger.sensors || wf.trigger.sensors.length === 0)) errors.push('sensors');
  if (wf.trigger.type === 'schedule' && (!wf.trigger.times || wf.trigger.times.length === 0)) errors.push('times');
  if (!wf.steps || wf.steps.length === 0) errors.push('steps');

  const stepErrors = (wf.steps || []).map(s => {
    const e = [];
    if (!s.deviceId) e.push('device');

    if (wf.trigger.type === 'schedule') {
      // On action: duration required
      if ((s.action === 'On' || !s.action) && !s.params?.duration) e.push('duration');
      // Pulse action: on, off, cycles required
      if (s.action === 'Pulse') {
        if (!s.params?.on) e.push('pulse_on');
        if (!s.params?.off) e.push('pulse_off');
        if (!s.params?.cycles) e.push('pulse_cycles');
      }
    }

    if (wf.trigger.type === 'sensor') {
      const sensorRows = s.sensorRows || [];
      const actionType = s.actionType || 'Regular';

      // Until required for every sensor row (all action types)
      const missingUntil = sensorRows.some(r => r.until == null || r.until === '');
      if (missingUntil) e.push('until');

      // Stepper Motor: run + wait required
      if (actionType === 'Stepper Motor') {
        if (!s.params?.run) e.push('run');
        if (!s.params?.wait) e.push('wait');
      }

      // Loop: times + on + off required
      if (actionType === 'Loop') {
        if (!s.params?.times) e.push('times');
        if (!s.params?.on) e.push('loop_on');
        if (!s.params?.off) e.push('loop_off');
      }
    }

    return e;
  });
  return { errors, stepErrors };
}

function detectConflicts(wf, allWorkflows) {
  const conflicts = {};

  // Collect all device IDs used in THIS workflow's steps (for future use)

  (wf.steps || []).forEach(step => {
    if (!step.deviceId) return;
    const device = DEVICES.find(d => d.id === step.deviceId);
    if (!device) return;

    // Rule conflict: device used in a Rule → time overlap
    if (device.status === 'rule') {
      conflicts[step.deviceId] = `Device shared with Rule "${device.ruleName}" with the same time — change time before saving`;
      return;
    }

    // Priority conflict: another workflow shares this device AND has same priority
    const conflictingWf = allWorkflows.find(other => {
      if (other.id === wf.id) return false;                     // skip self
      if (other.status === 'disabled') return false;             // disabled don't conflict
      if (other.priority !== wf.priority) return false;          // different priority = no conflict
      const otherDevices = (other.steps || []).map(s => s.deviceId);
      return otherDevices.includes(step.deviceId);
    });

    if (conflictingWf) {
      conflicts[step.deviceId] =
        `Device shared with Workflow "${conflictingWf.name}" with the same priority — change priority before saving`;
    }
  });

  return conflicts;
}

export function WorkflowConfigPage({ workflows, onWorkflowsChange }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [workflow, setWorkflow] = useState(() => {
    if (isNew) {
      // Find the lowest unused priority number (1..10)
    const usedPriorities = new Set(workflows.map(w => w.priority));
    let nextPriority = 1;
    while (usedPriorities.has(nextPriority) && nextPriority <= 10) nextPriority++;
    if (nextPriority > 10) nextPriority = 10; // fallback if all slots taken
      return {
        id: 'new_' + Date.now(),
        name: '',
        priority: nextPriority,
        mode: 'sensor',
        status: 'new',
        enabled: false,
        isDefault: false,
        trigger: {
          type: 'sensor',
          sensors: [],
          logic: null,
          activationDelay: { minutes: 0, seconds: 10 },
        },
        activeHours: {
          enabled: false,
          from: '06:00',
          until: '18:00',
          days: [true, true, true, true, true, true, true],
        },
        notifications: { onCompletion: true, onFailure: true },
        steps: [],
      };
    }
    return workflows.find(w => w.id === id) || null;
  });

  const [disableDialog, setDisableDialog] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync sensorRows in all steps when trigger sensors change.
  // Called by TriggerSection whenever the sensor list changes.
  const updateWorkflow = useCallback((updated) => {
    const prevSensors = workflow.trigger?.sensors || [];
    const nextSensors = updated.trigger?.sensors || [];
    const sensorsChanged =
      prevSensors.length !== nextSensors.length ||
      prevSensors.some((s, i) => s.sensorId !== nextSensors[i]?.sensorId);

    if (sensorsChanged && updated.trigger?.type === 'sensor' && updated.steps?.length > 0) {
      // Rebuild sensorRows for every step to match new trigger sensors
      const syncedSteps = updated.steps.map(step => ({
        ...step,
        sensorRows: nextSensors.map(s => {
          // Preserve existing row data if sensor already existed in this step
          const existing = (step.sensorRows || []).find(r => r.sensorId === s.sensorId);
          return existing
            ? existing
            : { sensorId: s.sensorId, from: s.value, currentValue: null, until: '' };
        }),
      }));
      setWorkflow({ ...updated, steps: syncedSteps });
    } else {
      setWorkflow(updated);
    }
  }, [workflow.trigger]);

  if (!workflow) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Workflow not found.</p>
          <button
            onClick={() => navigate('/workflows')}
            className="text-sm text-[#2d6a4f] font-medium hover:underline"
          >
            ← Back to Library
          </button>
        </div>
      </div>
    );
  }

  const isActive = ['running', 'synchronizing'].includes(workflow.status);
  const isError = workflow.status === 'error';
  const isEditable = workflow.status === 'disabled' || isNew;
  const disabled = !isEditable;

  const { errors, stepErrors } = validateWorkflow(workflow);
  const hasErrors = saveAttempted && (errors.length > 0 || stepErrors.some(e => e.length > 0));

  const stepConflicts = detectConflicts(workflow, workflows);
  const hasConflicts = Object.keys(stepConflicts).length > 0;

  const handleToggle = () => {
    if (isActive) {
      setDisableDialog(true);
    } else if (workflow.status === 'disabled') {
      // Re-enable: validate first
      const v = validateWorkflow(workflow);
      if (v.errors.length > 0 || v.stepErrors.some(e => e.length > 0)) {
        setSaveAttempted(true);
        return;
      }
      const updated = { ...workflow, status: 'idle', enabled: true };
      onWorkflowsChange(workflows.map(w => w.id === updated.id ? updated : w));
      updateWorkflow(updated);
    } else {
      // idle / error / completed — disable directly (no confirmation needed)
      const updated = { ...workflow, status: 'disabled', enabled: false };
      onWorkflowsChange(workflows.map(w => w.id === updated.id ? updated : w));
      updateWorkflow(updated);
    }
  };

  const confirmDisable = () => {
    const updated = { ...workflow, status: 'disabled', enabled: false };
    onWorkflowsChange(workflows.map(w => w.id === updated.id ? updated : w));
    updateWorkflow(updated);
    setDisableDialog(false);
  };

  const handleSave = () => {
    setSaveAttempted(true);
    const v = validateWorkflow(workflow);
    const hasValidationErrors = v.errors.length > 0 || v.stepErrors.some(e => e.length > 0);

    if (hasValidationErrors || hasConflicts) {
      // Scroll to first visible error after React re-renders
      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    const toSave = isNew ? { ...workflow, status: 'disabled' } : workflow;
    if (isNew) {
      onWorkflowsChange([...workflows, toSave]);
    } else {
      onWorkflowsChange(workflows.map(w => w.id === toSave.id ? toSave : w));
    }
    setSaved(true);
    setTimeout(() => navigate('/workflows'), 600);
  };

  const addStep = () => {
    const newStep = workflow.trigger.type === 'sensor'
      ? createNewSensorStep(workflow.trigger.sensors)
      : createNewScheduleStep();
    updateWorkflow({ ...workflow, steps: [...workflow.steps, newStep] });
  };

  const updateStep = (idx, updated) => {
    const steps = workflow.steps.map((s, i) => i === idx ? updated : s);
    updateWorkflow({ ...workflow, steps });
  };

  const removeStep = (idx) => {
    if (!isEditable) return;
    updateWorkflow({ ...workflow, steps: workflow.steps.filter((_, i) => i !== idx) });
  };

  const isSensor = workflow.trigger.type === 'sensor';
  const stepCountLabel = `${workflow.steps.length} ${workflow.steps.length === 1 ? 'step' : 'steps'}`;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* ── Sticky top bar ─────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="w-full px-6 md:px-10 py-3">
          {/* Single row on desktop, wraps on mobile */}
          <div className="flex items-center gap-3 flex-wrap">
          {/* Back link */}
          <button
            onClick={() => navigate('/workflows')}
            className="text-sm text-[#2d6a4f] font-medium hover:underline shrink-0 flex items-center gap-1"
          >
            <span>‹</span>
            <span className="hidden sm:inline">Workflow Library</span>
            <span className="sm:hidden">Back</span>
          </button>

          <span className="text-gray-200 hidden sm:inline">|</span>

          {/* Workflow name */}
          <input
            type="text"
            value={workflow.name}
            onChange={e => updateWorkflow({ ...workflow, name: e.target.value })}
            disabled={disabled}
            placeholder="Workflow name..."
            data-error={saveAttempted && errors.includes('name') ? 'true' : 'false'}
            className={cn(
              'border rounded-xl px-3 py-1.5 text-base font-semibold bg-white',
              'w-48 sm:w-64 md:flex-1 md:min-w-0 md:max-w-xs',
              saveAttempted && errors.includes('name')
                ? 'border-red-400 ring-1 ring-red-300'
                : 'border-gray-200 focus:border-[#2d6a4f] focus:outline-none'
            )}
          />

          {/* Status badge */}
          <StatusBadge status={workflow.status === 'new' ? 'idle' : workflow.status} />

          {/* Meta info */}
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span className="hidden sm:inline text-gray-200">·</span>
            <span>{isSensor ? 'Sensor' : 'Schedule'}</span>
            <span className="text-gray-200">·</span>
            <span>{stepCountLabel}</span>
            <span className="text-gray-200">·</span>
            <span>Priority</span>
            <input
              type="number"
              min="1" max="10"
              value={workflow.priority}
              onChange={e => updateWorkflow({ ...workflow, priority: Number(e.target.value) })}
              disabled={!isEditable}
              title={!isEditable ? 'Disable the Workflow to change priority' : 'Priority 1–10 (lower = higher priority)'}
              className="border border-gray-200 rounded-lg px-2 py-0.5 text-xs w-12 text-center disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500">{workflow.enabled ? 'Enabled' : 'Disabled'}</span>
            <Toggle checked={workflow.enabled} onChange={handleToggle} />
          </div>
        </div>{/* /flex row */}
        </div>{/* /max-w-6xl */}
      </div>{/* /sticky header */}

      <div className="w-full px-6 md:px-10 py-6">
        {/* Error status banner */}
        {isError && (() => {
          const failedSteps = workflow.steps
            .map((s, idx) => ({ ...s, num: idx + 1 }))
            .filter(s => s.status === 'error');
          const failedDesc = failedSteps.length > 0
            ? failedSteps.map(s => {
                const dev = DEVICES.find(d => d.id === s.deviceId);
                const base = `Step ${s.num}${dev ? ` (${dev.name})` : ''}`;
                return s.errorReason ? `${base}: ${s.errorReason}` : base;
              }).join('; ')
            : null;
          return (
            <AlertBanner
              message={failedDesc
                ? `Workflow stopped due to an error — ${failedDesc}. Disable the Workflow, fix the configuration, then re-enable.`
                : 'Workflow stopped due to a Step error. Disable and fix the configuration to restart.'
              }
              variant="error"
            />
          );
        })()}

        {/* Validation errors */}
        {hasErrors && (
          <div
            data-error="true"
            className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
          >
            Please fill in all required fields before saving.
          </div>
        )}

        {/* Trigger */}
        <TriggerSection workflow={workflow} onChange={updateWorkflow} disabled={disabled} saveAttempted={saveAttempted} />

        {/* Active Hours */}
        <ActiveHoursSection workflow={workflow} onChange={updateWorkflow} disabled={disabled} />

        {/* Notifications */}
        <NotificationsSection workflow={workflow} onChange={updateWorkflow} disabled={disabled} />

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-800">
              Steps
              <span className="ml-2 text-xs font-normal text-gray-400">
                {isSensor
                  ? 'Sensor-triggered actions on each device'
                  : 'Sequential commands after schedule fires'}
              </span>
            </h3>
            {isEditable && (
              <button onClick={addStep} className="text-sm text-[#2d6a4f] font-medium hover:underline">
                + Add Step
              </button>
            )}
          </div>

          <div className="px-4 pb-5 border-t border-gray-50">
            {/* Column headers — desktop only */}
            <div className="hidden md:flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-50">
              <span className="w-6 shrink-0">#</span>
              <span className="w-44 shrink-0">DEVICE</span>
              {isSensor ? (
                <>
                  {/* Sensor column: name(80px) + FROM(56px) + NOW(56px) + UNTIL(56px) + unit(~40px) */}
                  <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                    <span className="w-20 shrink-0">SENSOR</span>
                    <span className="w-14 text-center">FROM</span>
                    <span className="w-14 text-center">NOW</span>
                    <span className="w-14 text-center">UNTIL</span>
                  </div>
                  <span className="w-32 shrink-0">ACTION TYPE</span>
                  <span className="w-44 shrink-0">PARAMS</span>
                </>
              ) : (
                <>
                  <span className="w-20 shrink-0">ACTION</span>
                  <span className="flex-1">PARAMS</span>
                </>
              )}
              <span className="w-16 shrink-0 text-right">STATUS</span>
              {isEditable && <span className="w-5 shrink-0" />}
            </div>

            {/* Empty state */}
            {workflow.steps.length === 0 && (
              <div className="text-sm text-gray-400 px-3 py-6 border border-dashed border-gray-200 rounded-xl text-center mt-2">
                {isSensor
                  ? 'Add steps below. Each step defines which device acts, when sensor values cross certain thresholds.'
                  : 'Add steps below. Steps execute in sequence after the schedule trigger fires.'}
              </div>
            )}

            {saveAttempted && errors.includes('steps') && (
              <p className="text-xs text-red-500 mb-2 px-2 mt-2">At least one step is required.</p>
            )}

            <div className="mt-2 space-y-2">
              {workflow.steps.map((step, idx) =>
                isSensor ? (
                  <SensorStepRow
                    key={step.id}
                    step={step}
                    index={idx}
                    triggerSensors={workflow.trigger.sensors}
                    triggerLogic={workflow.trigger.logic}
                    onChange={updated => updateStep(idx, updated)}
                    onRemove={() => removeStep(idx)}
                    disabled={disabled}
                    saveAttempted={saveAttempted}
                    stepConflicts={stepConflicts}
                  />
                ) : (
                  <ScheduleStepRow
                    key={step.id}
                    step={step}
                    index={idx}
                    onChange={updated => updateStep(idx, updated)}
                    onRemove={() => removeStep(idx)}
                    disabled={disabled}
                    saveAttempted={saveAttempted}
                    stepConflicts={stepConflicts}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* Save button */}
        {isEditable && (
          <div className="flex justify-end mt-4 pb-4">
            <button
              onClick={handleSave}
              disabled={saved}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all',
                saved
                  ? 'bg-green-600 text-white scale-95'
                  : hasConflicts
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
              )}
            >
              {saved ? (
                '✓ Saved!'
              ) : hasConflicts ? (
                '⚠ Conflicts — resolve first'
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Disable running dialog */}
      <ConfirmDialog
        open={disableDialog}
        title="Disable Running Workflow?"
        description={`"${workflow.name}" is currently running. All devices turned on by this Workflow will be switched off immediately.`}
        confirmLabel="Disable"
        confirmVariant="danger"
        onConfirm={confirmDisable}
        onCancel={() => setDisableDialog(false)}
      />
    </div>
  );
}
