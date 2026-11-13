import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { brandColors } from "./colors";

const theme = readFileSync(join(__dirname, "../styles/theme.css"), "utf8");

describe("brandColors", () => {
  it.each([
    ["evergreen", "--color-even-evergreen"],
    ["white", "--color-white"],
  ] as const)("%s coincide con %s de theme.css", (key, token) => {
    const match = theme.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`));
    expect(match?.[1].toLowerCase()).toBe(brandColors[key]);
  });
});
