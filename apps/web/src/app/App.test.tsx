import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../features/auth/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../features/auth/auth-context", () => ({
  useAuth: () => ({
    user: null,
    idToken: null,
    organizationId: "merchant-berrechid",
    role: "OWNER",
    orgType: "MERCHANT",
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    demoSignIn: vi.fn(),
  }),
}));

import { App } from "./App";

describe("App routing", () => {
  it("renders the sign-in interface for a signed-out user", () => {
    window.history.replaceState({}, "", "/");
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Sign in to your portal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Demo finance team" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Demo supplier" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["/control-tower/overview", "Good morning, Nadia"],
    ["/control-tower/evidence/new", "Add financial evidence"],
    ["/control-tower/audit", "Audit center"],
    ["/control-tower/cash-flow", "Cash-flow forecast"],
    ["/control-tower/suppliers", "Supplier portfolio"],
    ["/control-tower/records", "Connected records"],
  ])("renders the preview interface at %s", async (path, heading) => {
    window.history.replaceState({}, "", path);
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: heading }),
    ).toBeInTheDocument();
    expect(screen.getByText("Preview data")).toBeInTheDocument();
  });

  it("redirects old supplier links to the finance control tower", async () => {
    window.history.replaceState({}, "", "/supplier/opportunities");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Good morning, Nadia" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Demand opportunities" }),
    ).not.toBeInTheDocument();
  });

  it("uses structured product and unit controls for evidence review", async () => {
    window.history.replaceState(
      {},
      "",
      "/control-tower/ingestions/ing-demo-001",
    );
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Review extracted evidence" }),
    ).toBeInTheDocument();
    expect(
      await screen.findAllByRole("combobox", { name: /Approved product/ }),
    ).toHaveLength(1);
    expect(
      await screen.findAllByRole("combobox", { name: /Purchasing unit/ }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Confirm financial record" }),
    ).toBeEnabled();
    expect(screen.queryByLabelText("Your answer")).not.toBeInTheDocument();
  });
});
