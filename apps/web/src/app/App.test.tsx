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

describe("App scaffold", () => {
  it("renders the MIZAN Souq dashboard", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "MIZAN Souq Dashboard" })).toBeInTheDocument();
  });
});
