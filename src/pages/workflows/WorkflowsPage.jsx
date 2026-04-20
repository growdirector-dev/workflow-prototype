import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { initialWorkflows } from '@/lib/mockData.js';
import { WorkflowLibraryPage } from './WorkflowLibraryPage.jsx';
import { WorkflowConfigPage } from './WorkflowConfigPage.jsx';

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState(initialWorkflows);

  return (
    <Routes>
      <Route
        index
        element={
          <WorkflowLibraryPage
            workflows={workflows}
            onWorkflowsChange={setWorkflows}
          />
        }
      />
      <Route
        path=":id"
        element={
          <WorkflowConfigPage
            workflows={workflows}
            onWorkflowsChange={setWorkflows}
          />
        }
      />
    </Routes>
  );
}
