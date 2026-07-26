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
      screen.getByRole("button", { name: "Demo merchant" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["/merchant/evidence/new", "Add today’s business evidence"],
    ["/merchant/inventory", "Inventory"],
    ["/supplier/opportunities", "Demand opportunities"],
  ])("renders the preview interface at %s", async (path, heading) => {
    window.history.replaceState({}, "", path);
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Interface preview uses the stable synthetic Berrechid demo data.",
      ),
    ).toBeInTheDocument();
  });
});
