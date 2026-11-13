import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TermsCheckbox, termsLinks } from "./terms-checkbox";

const label = (linkClass: string) => (
  <>
    Acepto los <a className={linkClass}>términos</a>
  </>
);

describe("TermsCheckbox", () => {
  it("avisa el cambio al tocar el texto", () => {
    const onChange = vi.fn();
    render(<TermsCheckbox checked={false} onChange={onChange} label={label} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("no cambia si está deshabilitado", async () => {
    const onChange = vi.fn();
    render(<TermsCheckbox checked={false} onChange={onChange} disabled label={label} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("la variante light usa el enlace evergreen", () => {
    render(<TermsCheckbox checked onChange={() => {}} variant="light" label={label} />);
    expect(screen.getByText("términos").className).toContain("text-even-evergreen");
  });
});

describe("termsLinks", () => {
  it("abre términos y privacidad en pestaña nueva", () => {
    const links = termsLinks("x");
    const { container } = render(<>{links.terms("T")}{links.privacy("P")}</>);
    const anchors = container.querySelectorAll("a");
    expect(anchors[0].getAttribute("href")).toBe("https://www.letseven.io/terminos");
    expect(anchors[1].getAttribute("href")).toBe("https://www.letseven.io/privacidad");
    expect(anchors[0].getAttribute("rel")).toBe("noopener noreferrer");
  });
});
