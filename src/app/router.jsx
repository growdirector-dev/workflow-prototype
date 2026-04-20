import { createBrowserRouter, redirect } from "react-router-dom";

import { AppLayout } from "@/app/AppLayout.jsx";
import { WorkflowsPage } from "@/pages/workflows/WorkflowsPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        loader: () => redirect("/workflows"),
      },
      {
        path: "workflows",
        element: <WorkflowsPage />,
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
  },
});
