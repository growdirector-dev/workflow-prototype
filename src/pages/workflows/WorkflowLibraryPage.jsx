import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils.js';
import { DEVICES } from '@/lib/mockData.js';
import { Toggle, StatusBadge, PriorityBadge, ConfirmDialog } from '@/widgets/ui.jsx';

// Max content width — keeps the page from stretching too wide on large screens
const INNER = 'w-full';

function TriggerPill({ label }) {
  return (
    <span className="inline-flex items-center bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap">
      {label}
    </span>
  );
}

function AndOrTag({ logic }) {
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap',
      logic === 'AND' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
    )}>
      {logic}
    </span>
  );
}

function TriggerSummary({ workflow }) {
  if (!workflow.trigger) return <span className="text-gray-300 text-xs">—</span>;

  if (workflow.trigger.type === 'sensor') {
    const sensors = workflow.trigger.sensors || [];
    const sensorNames = { s1: 'Temperature', s2: 'Humidity', s3: 'CO₂', s4: 'Light', s5: 'Soil', s6: 'pH', s7: 'EC' };
    if (sensors.length === 0) return <span className="text-xs text-gray-400">No sensors configured</span>;
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {sensors.map((s, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && workflow.trigger.logic && <AndOrTag logic={workflow.trigger.logic} />}
            <TriggerPill label={sensorNames[s.sensorId] || s.sensorId} />
          </span>
        ))}
      </div>
    );
  }

  const times = workflow.trigger.times || [];
  if (times.length === 0) return <span className="text-xs text-gray-400">No times set</span>;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {times.map(t => <TriggerPill key={t} label={t} />)}
    </div>
  );
}

// Detect if a workflow has a device conflict with another active workflow
// (same device, device status indicates it's already in use by another entity)
function hasConflictIndicator(wf, allWorkflows) {
  if (!wf.steps?.length) return false;
  const activeOthers = allWorkflows.filter(
    o => o.id !== wf.id && ['running', 'synchronizing', 'idle'].includes(o.status)
  );
  return wf.steps.some(step => {
    if (!step.deviceId) return false;
    const device = DEVICES.find(d => d.id === step.deviceId);
    if (!device) return false;
    if (device.status === 'rule') return true;
    // Another active workflow has same device and same priority
    return activeOthers.some(other =>
      other.priority === wf.priority &&
      (other.steps || []).some(s => s.deviceId === step.deviceId)
    );
  });
}

function WorkflowRow({ wf, allWorkflows, onToggle, onDelete, onDeleteBlocked }) {
  const navigate = useNavigate();
  const isError = wf.status === 'error';
  const isDisabled = wf.status === 'disabled';
  const showTrash = true;
  const hasConflict = hasConflictIndicator(wf, allWorkflows);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!isDisabled) onDeleteBlocked(wf.name);
    else onDelete(wf);
  };

  return (
    <div
      onClick={() => navigate(`/workflows/${wf.id}`)}
      className={cn(
        'relative flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50/80 transition-colors',
        isError && 'bg-red-50/40'
      )}
    >
      {/* Error left stripe */}
      {isError && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}

      {/* Priority badge */}
      <PriorityBadge priority={wf.priority} />

      {/* Name + status  — fixed width on desktop so trigger column starts consistently */}
      <div className="w-44 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-semibold text-sm truncate max-w-[130px]', isDisabled ? 'text-gray-400' : 'text-gray-900')}>
            {wf.name}
          </span>
          {wf.isDefault && (
            <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
              Default
            </span>
          )}
        </div>
        <div className="mt-0.5">
          <StatusBadge status={wf.status} />
        </div>
      </div>

      {/* Trigger summary — flex-1 fills available space */}
      <div className={cn('flex-1 min-w-0', isDisabled && 'opacity-40')}>
        <TriggerSummary workflow={wf} />
      </div>

      {/* Steps count */}
      <div className={cn(
        'shrink-0 text-xs flex items-center gap-1 w-20 hidden sm:flex',
        isDisabled ? 'text-gray-300' : 'text-gray-400'
      )}>
        <span>≡</span>
        <span>{wf.steps.length} {wf.steps.length === 1 ? 'step' : 'steps'}</span>
      </div>

      {/* Conflict indicator */}
      {hasConflict && (
        <div
          title="Device conflict detected"
          className="shrink-0 hidden sm:flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Conflict
        </div>
      )}

      {/* Toggle + label + delete */}
      <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
        <span className={cn('text-xs hidden md:inline', isDisabled ? 'text-gray-400' : 'text-gray-600')}>
          {wf.enabled ? 'Enabled' : 'Disabled'}
        </span>
        <Toggle checked={wf.enabled} onChange={() => onToggle(wf)} size="sm" />
        {showTrash && (
          <button
            onClick={handleDeleteClick}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isDisabled
                ? 'text-red-400 hover:text-red-500 hover:bg-red-50'
                : 'text-gray-200 hover:text-red-300 hover:bg-red-50'
            )}
            title={isDisabled ? 'Delete workflow' : 'Disable first to delete'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function WorkflowLibraryPage({ workflows, onWorkflowsChange }) {
  const navigate = useNavigate();
  const [disableDialog, setDisableDialog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteBlockedName, setDeleteBlockedName] = useState(null);

  const activeStatuses = new Set(['running', 'synchronizing', 'idle', 'error', 'completed']);
  const activeWorkflows = workflows.filter(w => activeStatuses.has(w.status)).sort((a, b) => a.priority - b.priority);
  const inactiveWorkflows = workflows.filter(w => w.status === 'disabled').sort((a, b) => a.priority - b.priority);

  // Conflicts = workflows with Error status OR with a device conflict indicator
  const conflictCount = workflows.filter(w =>
    w.status === 'error' || hasConflictIndicator(w, workflows)
  ).length;

  const counts = {
    active: activeWorkflows.length,
    disabled: inactiveWorkflows.length,
    conflicts: conflictCount,
  };

  const [enableBlockedMsg, setEnableBlockedMsg] = useState(null);

  const handleToggle = (wf) => {
    if (wf.status === 'running' || wf.status === 'synchronizing') {
      setDisableDialog({ workflowId: wf.id, name: wf.name });
    } else if (wf.status === 'disabled') {
      // Block enabling if workflow has a device conflict
      if (hasConflictIndicator(wf, workflows)) {
        setEnableBlockedMsg(`"${wf.name}" has a device conflict and cannot be enabled until the conflict is resolved.`);
        setTimeout(() => setEnableBlockedMsg(null), 4000);
        return;
      }
      onWorkflowsChange(workflows.map(w => w.id === wf.id ? { ...w, status: 'idle', enabled: true } : w));
    } else {
      onWorkflowsChange(workflows.map(w => w.id === wf.id ? { ...w, status: 'disabled', enabled: false } : w));
    }
  };

  const confirmDisable = () => {
    onWorkflowsChange(workflows.map(w =>
      w.id === disableDialog.workflowId ? { ...w, status: 'disabled', enabled: false } : w
    ));
    setDisableDialog(null);
  };

  const handleDeleteBlocked = (name) => {
    setDeleteBlockedName(name);
    setTimeout(() => setDeleteBlockedName(null), 3500);
  };

  const confirmDelete = () => {
    onWorkflowsChange(workflows.filter(w => w.id !== deleteDialog.workflowId));
    setDeleteDialog(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className={cn(INNER, 'px-6 md:px-10 py-5 flex items-center justify-between gap-4')}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">WORKFLOWS</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Workflow Library</h1>
            <p className="text-sm text-gray-400 mt-0.5 hidden md:block">
              Browse active automations, open an existing workflow, or create a new one.
            </p>
          </div>
          <button
            onClick={() => navigate('/workflows/new')}
            className="flex items-center gap-2 bg-[#2d6a4f] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#245a42] transition-colors shadow-sm shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Create Workflow</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className={cn(INNER, 'px-6 md:px-10 py-6')}>

        {/* Counter cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-green-100 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-3xl font-bold text-[#2d6a4f]">{counts.active}</p>
            <p className="text-xs text-gray-500 mt-1 font-semibold uppercase tracking-wide">Active</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-3xl font-bold text-gray-500">{counts.disabled}</p>
            <p className="text-xs text-gray-500 mt-1 font-semibold uppercase tracking-wide">Disabled</p>
          </div>
          <div className={cn('rounded-2xl p-5 text-center border shadow-sm', counts.conflicts > 0 ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100')}>
            <p className={cn('text-3xl font-bold', counts.conflicts > 0 ? 'text-amber-500' : 'text-gray-500')}>{counts.conflicts}</p>
            <p className="text-xs text-gray-500 mt-1 font-semibold uppercase tracking-wide">Conflicts</p>
          </div>
        </div>

        {/* Enable-blocked toast */}
        {enableBlockedMsg && (
          <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span>⚠</span>
            <span>{enableBlockedMsg}</span>
          </div>
        )}

        {/* Delete-blocked toast */}
        {deleteBlockedName && (
          <div className="flex items-center gap-2 p-3 mb-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <span>⚠</span>
            <span>Disable <strong>{deleteBlockedName}</strong> before deleting it.</span>
          </div>
        )}

        {/* ACTIVE section */}
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">ACTIVE</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-sm">
            {activeWorkflows.length === 0
              ? <div className="px-6 py-10 text-center text-sm text-gray-400">No active workflows</div>
              : activeWorkflows.map(wf => (
                  <WorkflowRow
                    key={wf.id} wf={wf}
                    allWorkflows={workflows}
                    onToggle={handleToggle}
                    onDelete={wf => setDeleteDialog({ workflowId: wf.id, name: wf.name })}
                    onDeleteBlocked={handleDeleteBlocked}
                  />
                ))
            }
          </div>
        </div>

        {/* INACTIVE section */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">INACTIVE</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-sm">
            {inactiveWorkflows.length === 0
              ? <div className="px-6 py-10 text-center text-sm text-gray-400">No disabled workflows</div>
              : inactiveWorkflows.map(wf => (
                  <WorkflowRow
                    key={wf.id} wf={wf}
                    allWorkflows={workflows}
                    onToggle={handleToggle}
                    onDelete={wf => setDeleteDialog({ workflowId: wf.id, name: wf.name })}
                    onDeleteBlocked={handleDeleteBlocked}
                  />
                ))
            }
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={!!disableDialog}
        title="Disable Running Workflow?"
        description={`"${disableDialog?.name}" is currently running. All devices turned on by this Workflow will be switched off immediately.`}
        confirmLabel="Disable" confirmVariant="danger"
        onConfirm={confirmDisable} onCancel={() => setDisableDialog(null)}
      />
      <ConfirmDialog
        open={!!deleteDialog}
        title="Delete Workflow?"
        description={`Are you sure you want to permanently delete "${deleteDialog?.name}"?`}
        confirmLabel="Delete" confirmVariant="danger"
        onConfirm={confirmDelete} onCancel={() => setDeleteDialog(null)}
      />
    </div>
  );
}
