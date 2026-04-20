import { render, screen } from "@testing-library/react";

import App from "@/App.jsx";

describe("App", () => {
  it("renders the landing page heading", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /hello world/i })).toBeInTheDocument();
  });
});
