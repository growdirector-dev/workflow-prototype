import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";

import App from "@/App.jsx";
import { createAppRouter } from "@/app/router.jsx";

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("redirects to workflows and renders the placeholder page", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: /workflows/i })).toBeInTheDocument();
    expect(screen.getByText(/workflow list and editor content will be migrated next/i)).toBeInTheDocument();
  });

  it("resolves the workflows route under the GitHub Pages basename", async () => {
    window.history.replaceState({}, "", "/workflow-prototype/");

    const router = createAppRouter({ basename: "/workflow-prototype/" });

    render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);

    expect(await screen.findByRole("heading", { name: /workflows/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/workflow-prototype/workflows");
  });
});
