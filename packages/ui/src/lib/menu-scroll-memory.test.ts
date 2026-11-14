import { describe, expect, it } from "vitest";
import { rememberMenuPosition, setMenuCategory, takeMenuPosition } from "./menu-scroll-memory";

function element(top: number) {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => ({ top }) as DOMRect;
  return el;
}

describe("menuScrollMemory", () => {
  it("devuelve la posición guardada una sola vez", () => {
    setMenuCategory("Bebidas");
    rememberMenuPosition("rest-1", "42", element(120));
    expect(takeMenuPosition("rest-1")).toEqual({ key: "rest-1", category: "Bebidas", itemId: "42", itemTop: 120 });
    expect(takeMenuPosition("rest-1")).toBeNull();
  });

  it("ignora (y descarta) una posición de otro menú", () => {
    rememberMenuPosition("rest-1", "42", element(10));
    expect(takeMenuPosition("rest-2")).toBeNull();
    expect(takeMenuPosition("rest-1")).toBeNull();
  });
});
