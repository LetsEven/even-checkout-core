import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FullScreenLoader } from "./loader";

describe("FullScreenLoader", () => {
  it("se anuncia como estado y lleva el marcador que usa TermsUpdateToast", () => {
    render(<FullScreenLoader label="Even" />);
    const loader = screen.getByRole("status", { name: "Even" });
    expect(loader.hasAttribute("data-even-loader")).toBe(true);
  });
});
