import { useState } from 'react';
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
  const stepErrors = (wf.steps || []).map((s) => {
    const e = [];
    if (!s.deviceId) e.push('device');
    if (wf.trigger.type === 'schedule' && s.action === 'On' && !s.params?.duration) e.push('duration');
    return e;
  });
  return { errors, stepErrors };
}

function detectConflicts(wf) {
  // Returns map of stepId -> conflict message
  const conflicts = {};
  (wf.steps || []).forEach(step => {
    const device = DEVICES.find(d => d.id === step.deviceId);
    if (!device) return;
    if (device.status === 'rule') {
      conflicts[step.deviceId] = `Device shared with Rule (${device.ruleName}) with the same time — change time before saving`;
    }
    // workflow conflict with same priority would need more complex logic - simplified here
  });
  return conflicts;
}

export function WorkflowConfigPage({ workflows, onWorkflowsChange }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [workflow, setWorkflow] = useState(() => {
    if (isNew) {
      const maxPriority = Math.max(0, ...workflows.map(w => w.priority));
      return {
        id: 'new_' + Date.now(),
        name: '',
        priority: maxPriority + 1,
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

  if (!workflow) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <p className="text-gray-500">Workflow not found.</p>
      </div>
    );
  }

  const isActive = ['running', 'synchronizing'].includes(workflow.status);
  const isEditable = workflow.status === 'disabled' || isNew;
  const disabled = !isEditable;

  const { errors, stepErrors } = validateWorkflow(workflow);
  const hasErrors = saveAttempted && (errors.length > 0 || stepErrors.some(e => e.length > 0));

  const stepConflicts = detectConflicts(workflow);
  const hasConflicts = Object.keys(stepConflicts).length > 0;

  const handleToggle = () => {
    if (isActive) {
      setDisableDialog(true);
    } else if (workflow.status === 'disabled') {
      // Enable: validate first
      const v = validateWorkflow(workflow);
      if (v.errors.length > 0 || v.stepErrors.some(e => e.length > 0)) {
        setSaveAttempted(true);
        return;
      }
      const updated = { ...workflow, status: 'idle', enabled: true };
      onWorkflowsChange(workflows.map(w => w.id === updated.id ? updated : w));
      setWorkflow(updated);
    } else if (isNew) {
      // noop
    }
  };

  const confirmDisable = () => {
    const updated = { ...workflow, status: 'disabled', enabled: false };
    onWorkflowsChange(workflows.map(w => w.id === updated.id ? updated : w));
    setWorkflow(updated);
    setDisableDialog(false);
  };

  const handleSave = () => {
    setSaveAttempted(true);
    const v = validateWorkflow(workflow);
    if (v.errors.length > 0 || v.stepErrors.some(e => e.length > 0)) return;
    if (hasConflicts) return;

    const toSave = isNew
      ? { ...workflow, status: 'disabled' }
      : workflow;

    if (isNew) {
      onWorkflowsChange([...workflows, toSave]);
    } else {
      onWorkflowsChange(workflows.map(w => w.id === toSave.id ? toSave : w));
    }
    setSaved(true);
    setTimeout(() => {
      navigate('/workflows');
    }, 600);
  };

  const addStep = () => {
    const newStep = workflow.trigger.type === 'sensor'
      ? createNewSensorStep(workflow.trigger.sensors)
      : createNewScheduleStep();
    setWorkflow({ ...workflow, steps: [...workflow.steps, newStep] });
  };

  const updateStep = (idx, updated) => {
    const steps = workflow.steps.map((s, i) => i === idx ? updated : s);
    setWorkflow({ ...workflow, steps });
  };

  const removeStep = (idx) => {
    if (!isEditable) return;
    const steps = workflow.steps.filter((_, i) => i !== idx);
    setWorkflow({ ...workflow, steps });
  };

  const isSensor = workflow.trigger.type === 'sensor';

  const stepCountLabel = `${workflow.steps.length} ${workflow.steps.length === 1 ? 'step' : 'steps'}`;
  const modeLabel = isSensor ? 'Sensor mode' : 'Schedule mode';

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/workflows')}
            className="text-sm text-[#2d6a4f] font-medium hover:underline shrink-0 flex items-center gap-1"
          >
            ‹ Back to Workflow Library
          </button>

          <input
            type="text"
            value={workflow.name}
            onChange={e => setWorkflow({ ...workflow, name: e.target.value })}
            disabled={disabled}
            placeholder="Workflow name..."
            className={cn(
              'border rounded-xl px-3 py-1.5 text-base font-medium bg-white flex-1 min-w-0',
              saveAttempted && errors.includes('name')
                ? 'border-red-400 ring-1 ring-red-300'
                : 'border-gray-200 focus:border-[#2d6a4f] focus:outline-none'
            )}
          />

          <div className="flex items-center gap-2 shrink-0 text-sm text-gray-500">
            <StatusBadge status={workflow.status === 'new' ? 'new' : workflow.status} />
            <span className="text-gray-300">·</span>
            <span>{stepCountLabel}</span>
            <span className="text-gray-300">·</span>
            <span>{modeLabel}</span>
            <span className="text-gray-300">·</span>
            <span>Priority</span>
            <input
              type="number"
              min="1"
              max="10"
              value={workflow.priority}
              onChange={e => setWorkflow({ ...workflow, priority: Number(e.target.value) })}
              disabled={!isEditable}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-14 text-center"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-gray-500">{workflow.enabled ? 'Enabled' : 'Disabled'}</span>
            <Toggle
              checked={workflow.enabled}
              onChange={handleToggle}
            />
          </div>
        </div>
      </div>

      <div className="px-5 py-5 max-w-5xl mx-auto">
        {/* Error banner for error status */}
        {workflow.status === 'error' && (
          <AlertBanner message="Workflow stopped due to a Step error" variant="error" />
        )}

        {/* Validation errors */}
        {hasErrors && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            Please fill in all required fields before saving.
          </div>
        )}

        {/* Trigger */}
        <TriggerSection
          workflow={workflow}
          onChange={setWorkflow}
          disabled={disabled}
        />

        {/* Active Hours (sensor only) */}
        <ActiveHoursSection
          workflow={workflow}
          onChange={setWorkflow}
          disabled={disabled}
        />

        {/* Notifications */}
        <NotificationsSection
          workflow={workflow}
          onChange={setWorkflow}
          disabled={disabled}
        />

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-800">Steps</h3>
            {isEditable && (
              <button
                onClick={addStep}
                className="text-sm text-[#2d6a4f] font-medium hover:underline"
              >
                + Add Step
              </button>
            )}
          </div>

          <div className="px-5 pb-5 border-t border-gray-50">
            {/* Step column headers */}
            <div className="flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest text-gray-400 font-semibold">
              <span className="w-10 shrink-0"></span>
              <span className="min-w-[140px]">DEVICE</span>
              {isSensor ? (
                <>
                  <span className="flex-1">SENSOR</span>
                  <span className="min-w-[120px]">ACTION TYPE</span>
                  <span className="shrink-0">PARAMS</span>
                </>
              ) : (
                <>
                  <span>ACTION</span>
                  <span className="flex-1">PARAMS</span>
                </>
              )}
              <span className="shrink-0 min-w-[60px] text-right">STATUS</span>
              {isEditable && <span className="w-4"></span>}
            </div>

            {/* Step hint */}
            {workflow.steps.length === 0 && (
              <div className="text-sm text-gray-400 px-3 py-4 border border-dashed border-gray-200 rounded-xl text-center">
                {isSensor
                  ? 'After the trigger fires, sensor value is checked at each step. Steps can run in parallel — next step activates when the previous one has started and its sensor condition is met.'
                  : 'After the trigger fires, steps execute in order. Command is sent to the device and the next step activates once the command is accepted.'}
              </div>
            )}

            {saveAttempted && errors.includes('steps') && (
              <p className="text-xs text-red-500 mb-2 px-3">At least one step is required.</p>
            )}

            {workflow.steps.map((step, idx) =>
              isSensor ? (
                <SensorStepRow
                  key={step.id}
                  step={step}
                  index={idx}
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

        {/* Save button */}
        {isEditable && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={saved}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors',
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              )}
            >
              {saved ? '✓ Saved' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

      {/* Disable dialog */}
      <ConfirmDialog
        open={disableDialog}
        title="Disable Running Workflow?"
        description={`${workflow.name} is currently running. All devices turned on by this Workflow will be switched off immediately.`}
        confirmLabel="Disable"
        confirmVariant="danger"
        onConfirm={confirmDisable}
        onCancel={() => setDisableDialog(false)}
      />
    </div>
  );
}
