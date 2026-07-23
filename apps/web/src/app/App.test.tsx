import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App scaffold", () => {
  it("identifies the repository", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "GemmaPunks" })).toBeInTheDocument();
  });
});

