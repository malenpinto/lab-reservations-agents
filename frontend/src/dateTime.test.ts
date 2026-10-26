import { describe, expect, it } from "vitest";
import { assertFutureStart, buenosAiresInputToIso } from "./dateTime";

describe("Buenos Aires reservation times", () => {
  it("converts local date and time to ISO with an explicit offset", () => {
    const iso = buenosAiresInputToIso("2099-06-15", "10:30");
    expect(iso).toMatch(/^2099-06-15T10:30:00[+-]\d{2}:\d{2}$/);
    expect(Number.isFinite(Date.parse(iso))).toBe(true);
  });

  it("rejects a start instant before now with a clear message", () => {
    expect(() => assertFutureStart("2000-01-01T10:00:00-03:00", Date.now()))
      .toThrow("No se pueden reservar horarios que ya pasaron.");
  });

  it("allows a start instant after now", () => {
    const now = Date.now();
    expect(() => assertFutureStart(new Date(now + 60_000).toISOString(), now)).not.toThrow();
  });
});
