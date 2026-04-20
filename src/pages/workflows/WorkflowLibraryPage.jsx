import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils.js';
import { Toggle, StatusBadge, PriorityBadge, ConfirmDialog } from '@/widgets/ui.jsx';

function getTriggerSummary(workflow) {
  if (workflow.trigger.type === 'sensor') {
    const sensors = workflow.trigger.sensors || [];
    if (sensors.length === 0) return 'No sensors configured';
    const parts = sensors.map(s => {
      const op = s.operator === 'Higher than' ? '>' : '<';
      return `${s.sensorId === 's1' ? 'Temperature' : s.sensorId === 's2' ? 'Humidity' : s.sensorId === 's3' ? 'CO₂' : s.sensorId === 's7' ? 'EC' : 'Sensor'} ${op} ${s.value}${s.unit}`;
    });
    if (parts.length === 1) return parts[0];
    return parts.join(` ${workflow.trigger.logic} `);
  } else {
    const times = workflow.trigger.times || [];
    return times.join(' · ');
  }
}

export function WorkflowLibraryPage({ workflows, onWorkflowsChange }) {
  const navigate = useNavigate();
  const [disableDialog, setDisableDialog] = useState(null); // { workflowId, name }
  const [deleteDialog, setDeleteDialog] = useState(null);   // { workflowId, name }
  const [deleteBlockedMsg, setDeleteBlockedMsg] = useState(null);

  const activeWorkflows = workflows
    .filter(w => ['running', 'synchronizing', 'idle', 'error'].includes(w.status))
    .sort((a, b) => a.priority - b.priority);

  const inactiveWorkflows = workflows
    .filter(w => w.status === 'disabled')
    .sort((a, b) => a.priority - b.priority);

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
      onWorkflowsChange(workflows.map(w => w.id === wf.id ? { ...w, status: 'disabled', enabled: false } : w));
    }
  };

  const confirmDisable = () => {
    onWorkflowsChange(workflows.map(w =>
      w.id === disableDialog.workflowId ? { ...w, status: 'disabled', enabled: false } : w
    ));
    setDisableDialog(null);
  };

  const handleDeleteClick = (e, wf) => {
    e.stopPropagation();
    if (wf.status !== 'disabled') {
      setDeleteBlockedMsg(wf.name);
      setTimeout(() => setDeleteBlockedMsg(null), 3000);
      return;
    }
    setDeleteDialog({ workflowId: wf.id, name: wf.name });
  };

  const confirmDelete = () => {
    onWorkflowsChange(workflows.filter(w => w.id !== deleteDialog.workflowId));
    setDeleteDialog(null);
  };

  const handleRowClick = (wf) => {
    navigate(`/workflows/${wf.id}`);
  };

  const renderRow = (wf) => {
    const isError = wf.status === 'error';
    const isDisabled = wf.status === 'disabled';
    const showTrash = !wf.isDefault;

    return (
      <div
        key={wf.id}
        onClick={() => handleRowClick(wf)}
        className={cn(
          'relative flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors',
          isError && 'bg-red-50',
        )}
      >
        {isError && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l" />
        )}

        {/* Priority badge */}
        <PriorityBadge priority={wf.priority} />

        {/* Name + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-medium text-sm', isDisabled ? 'text-gray-400' : 'text-gray-900')}>
              {wf.name}
            </span>
            <StatusBadge status={wf.status} />
            {wf.isDefault && (
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Default</span>
            )}
          </div>
          <p className={cn('text-xs mt-0.5 truncate', isDisabled ? 'text-gray-300' : 'text-gray-500')}>
            {getTriggerSummary(wf)}
          </p>
          <p className={cn('text-xs', isDisabled ? 'text-gray-300' : 'text-gray-400')}>
            {wf.steps.length} {wf.steps.length === 1 ? 'step' : 'steps'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
          <span className={cn('text-xs', isDisabled ? 'text-gray-300' : 'text-gray-500')}>
            {wf.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <Toggle
            checked={wf.enabled}
            onChange={() => handleToggle(wf)}
          />
          {showTrash && (
            <button
              onClick={(e) => handleDeleteClick(e, wf)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isDisabled ? 'text-red-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
              )}
              title={isDisabled ? 'Delete workflow' : 'Disable first to delete'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">WORKFLOWS</p>
            <h1 className="text-2xl font-semibold text-gray-900">Workflow Library</h1>
            <p className="text-sm text-gray-400 mt-0.5">Browse active automations, open an existing workflow, or create a new one.</p>
          </div>
          <button
            onClick={() => navigate('/workflows/new')}
            className="flex items-center gap-2 bg-[#2d6a4f] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#245a42] transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Create Workflow
          </button>
        </div>
      </div>

      <div className="px-6 py-5 max-w-5xl mx-auto">
        {/* Summary counters */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-[#2d6a4f]">{counts.active}</p>
            <p className="text-sm text-gray-500 mt-1">Active</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-gray-700">{counts.disabled}</p>
            <p className="text-sm text-gray-500 mt-1">Disabled</p>
          </div>
          <div className={cn('rounded-2xl p-5 text-center border', counts.error > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100')}>
            <p className={cn('text-3xl font-bold', counts.error > 0 ? 'text-red-500' : 'text-gray-700')}>{counts.error}</p>
            <p className="text-sm text-gray-500 mt-1">Error</p>
          </div>
        </div>

        {/* Delete blocked message */}
        {deleteBlockedMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <span>⚠</span>
            <span>Disable the workflow before deleting it.</span>
          </div>
        )}

        {/* ACTIVE section */}
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">ACTIVE</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {activeWorkflows.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No active workflows</div>
            ) : activeWorkflows.map(renderRow)}
          </div>
        </div>

        {/* INACTIVE section */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">INACTIVE</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {inactiveWorkflows.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No inactive workflows</div>
            ) : inactiveWorkflows.map(renderRow)}
          </div>
        </div>
      </div>

      {/* Disable running dialog */}
      <ConfirmDialog
        open={!!disableDialog}
        title="Disable Running Workflow?"
        description={`${disableDialog?.name} is currently running. All devices turned on by this Workflow will be switched off immediately.`}
        confirmLabel="Disable"
        confirmVariant="danger"
        onConfirm={confirmDisable}
        onCancel={() => setDisableDialog(null)}
      />

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteDialog}
        title="Delete Workflow?"
        description={`Are you sure you want to delete ${deleteDialog?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </div>
  );
}
