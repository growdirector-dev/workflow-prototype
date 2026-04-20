import { createBrowserRouter, redirect } from "react-router-dom";

import { AppLayout } from "@/app/AppLayout.jsx";
import { WorkflowsPage } from "@/pages/workflows/WorkflowsPage.jsx";

const normalizeBasename = (basename) => {
  if (!basename || basename === "/") {
    return "/";
  }
  return basename.endsWith("/") ? basename.slice(0, -1) : basename;
};

const routes = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        loader: () => redirect("workflows"),
      },
      {
        path: "workflows/*",
        element: <WorkflowsPage />,
      },
    ],
  },
];

export const createAppRouter = ({ basename = import.meta.env.BASE_URL } = {}) =>
  createBrowserRouter(routes, {
    basename: normalizeBasename(basename),
    future: {
      v7_startTransition: true,
    },
  });

export const router = createAppRouter();
