import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils.js';
import { Toggle, StatusBadge, PriorityBadge, ConfirmDialog } from '@/widgets/ui.jsx';

function getTriggerSummary(workflow) {
  if (!workflow.trigger) return '—';
  if (workflow.trigger.type === 'sensor') {
    const sensors = workflow.trigger.sensors || [];
    if (sensors.length === 0) return 'No sensors';
    const sensorNames = { s1: 'Temp', s2: 'Humidity', s3: 'CO₂', s4: 'Light', s5: 'Soil', s6: 'pH', s7: 'EC' };
    const parts = sensors.map(s => {
      const op = s.operator === 'Higher than' ? '>' : '<';
      return `${sensorNames[s.sensorId] || s.sensorId} ${op} ${s.value}${s.unit}`;
    });
    return parts.join(` ${workflow.trigger.logic || ''} `);
  }
  const times = workflow.trigger.times || [];
  return times.length > 0 ? times.join(' · ') : 'No times set';
}

function WorkflowRow({ wf, onToggle, onDelete, onDeleteBlocked }) {
  const navigate = useNavigate();
  const isError = wf.status === 'error';
  const isDisabled = wf.status === 'disabled';
  const showTrash = !wf.isDefault;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!isDisabled) {
      onDeleteBlocked(wf.name);
    } else {
      onDelete(wf);
    }
  };

  return (
    <div
      onClick={() => navigate(`/workflows/${wf.id}`)}
      className={cn(
        'relative flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors',
        isError && 'bg-red-50/60'
      )}
    >
      {/* Error left stripe */}
      {isError && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl" />}

      {/* Priority */}
      <PriorityBadge priority={wf.priority} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-semibold text-sm truncate', isDisabled ? 'text-gray-400' : 'text-gray-900')}>
            {wf.name}
          </span>
          <StatusBadge status={wf.status} />
          {wf.isDefault && (
            <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">Default</span>
          )}
        </div>
        <p className={cn('text-xs mt-0.5 truncate', isDisabled ? 'text-gray-300' : 'text-gray-400')}>
          {getTriggerSummary(wf)} · {wf.steps.length} {wf.steps.length === 1 ? 'step' : 'steps'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
        <Toggle
          checked={wf.enabled}
          onChange={() => onToggle(wf)}
          size="sm"
        />
        {showTrash && (
          <button
            onClick={handleDeleteClick}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isDisabled
                ? 'text-red-400 hover:text-red-500 hover:bg-red-50'
                : 'text-gray-200 hover:text-red-300 hover:bg-red-50'
            )}
            title={isDisabled ? 'Delete' : 'Disable first to delete'}
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
  const [disableDialog, setDisableDialog] = useState(null); // { workflowId, name }
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteBlockedName, setDeleteBlockedName] = useState(null);

  const activeStatuses = new Set(['running', 'synchronizing', 'idle', 'error']);
  const activeWorkflows = workflows.filter(w => activeStatuses.has(w.status)).sort((a, b) => a.priority - b.priority);
  const inactiveWorkflows = workflows.filter(w => w.status === 'disabled').sort((a, b) => a.priority - b.priority);

  const counts = {
    active: activeWorkflows.length,
    disabled: inactiveWorkflows.length,
    error: workflows.filter(w => w.status === 'error').length,
  };

  const handleToggle = (wf) => {
    if (wf.status === 'running' || wf.status === 'synchronizing') {
      setDisableDialog({ workflowId: wf.id, name: wf.name });
    } else if (wf.status === 'disabled') {
      onWorkflowsChange(workflows.map(w => w.id === wf.id ? { ...w, status: 'idle', enabled: true } : w));
    } else {
      // idle / error — disable directly
      onWorkflowsChange(workflows.map(w => w.id === wf.id ? { ...w, status: 'disabled', enabled: false } : w));
    }
  };

  const confirmDisable = () => {
    onWorkflowsChange(workflows.map(w => w.id === disableDialog.workflowId ? { ...w, status: 'disabled', enabled: false } : w));
    setDisableDialog(null);
  };

  const handleDeleteBlocked = (name) => {
    setDeleteBlockedName(name);
    setTimeout(() => setDeleteBlockedName(null), 3000);
  };

  const confirmDelete = () => {
    onWorkflowsChange(workflows.filter(w => w.id !== deleteDialog.workflowId));
    setDeleteDialog(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">WORKFLOWS</p>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Workflow Library</h1>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Browse active automations, open an existing workflow, or create a new one.</p>
            </div>
            <button
              onClick={() => navigate('/workflows/new')}
              className="flex items-center gap-1.5 bg-[#2d6a4f] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#245a42] transition-colors shadow-sm shrink-0"
            >
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">Create Workflow</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-5xl mx-auto">
        {/* Counters */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-green-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-[#2d6a4f]">{counts.active}</p>
            <p className="text-xs text-gray-500 mt-0.5">Active</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{counts.disabled}</p>
            <p className="text-xs text-gray-500 mt-0.5">Disabled</p>
          </div>
          <div className={cn('rounded-2xl p-4 text-center border', counts.error > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100')}>
            <p className={cn('text-2xl font-bold', counts.error > 0 ? 'text-red-500' : 'text-gray-600')}>{counts.error}</p>
            <p className="text-xs text-gray-500 mt-0.5">Error</p>
          </div>
        </div>

        {/* Delete blocked toast */}
        {deleteBlockedName && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <span>⚠</span>
            <span>Disable <strong>{deleteBlockedName}</strong> before deleting it.</span>
          </div>
        )}

        {/* ACTIVE section */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">ACTIVE</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-sm">
            {activeWorkflows.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No active workflows</div>
            ) : activeWorkflows.map(wf => (
              <WorkflowRow
                key={wf.id}
                wf={wf}
                onToggle={handleToggle}
                onDelete={wf => setDeleteDialog({ workflowId: wf.id, name: wf.name })}
                onDeleteBlocked={handleDeleteBlocked}
              />
            ))}
          </div>
        </div>

        {/* INACTIVE section */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">INACTIVE</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-sm">
            {inactiveWorkflows.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No disabled workflows</div>
            ) : inactiveWorkflows.map(wf => (
              <WorkflowRow
                key={wf.id}
                wf={wf}
                onToggle={handleToggle}
                onDelete={wf => setDeleteDialog({ workflowId: wf.id, name: wf.name })}
                onDeleteBlocked={handleDeleteBlocked}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={!!disableDialog}
        title="Disable Running Workflow?"
        description={`"${disableDialog?.name}" is currently running. All devices turned on by this Workflow will be switched off immediately.`}
        confirmLabel="Disable"
        confirmVariant="danger"
        onConfirm={confirmDisable}
        onCancel={() => setDisableDialog(null)}
      />

      <ConfirmDialog
        open={!!deleteDialog}
        title="Delete Workflow?"
        description={`Are you sure you want to permanently delete "${deleteDialog?.name}"?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </div>
  );
}
