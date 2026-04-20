import { render, screen } from "@testing-library/react";

import App from "@/App.jsx";

describe("App", () => {
  it("redirects to workflows and renders the placeholder page", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: /workflows/i })).toBeInTheDocument();
    expect(screen.getByText(/workflow list and editor content will be migrated next/i)).toBeInTheDocument();
  });
});
