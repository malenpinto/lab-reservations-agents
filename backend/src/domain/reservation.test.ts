import { describe, expect, it } from "vitest";
import { EQUIPMENT, isEquipmentId } from "./equipment";
import { intervalsOverlap, isAvailable, validateInterval, validateReservation } from "./reservation";

const validInput = {
  id: "r-1",
  equipmentId: "MIC-01",
  requester: "Ada Lovelace",
  start: "2026-11-02T10:00:00-03:00",
  end: "2026-11-02T11:00:00-03:00",
};

describe("inventory", () => {
  it("contains the five fixed physical units", () => {
    expect(EQUIPMENT.map(({ id }) => id)).toEqual(["MIC-01", "MIC-02", "OSC-01", "MUL-01", "FUE-01"]);
    expect(isEquipmentId("MIC-01")).toBe(true);
    expect(isEquipmentId("MIC-03")).toBe(false);
  });
});

describe("reservation validation", () => {
  it("accepts valid input and normalizes instants to UTC", () => {
    expect(validateReservation(validInput)).toEqual({
      ...validInput,
      requester: "Ada Lovelace",
      start: "2026-11-02T13:00:00.000Z",
      end: "2026-11-02T14:00:00.000Z",
      status: "ACTIVE",
    });
  });

  it("accepts leap days only in leap years", () => {
    expect(validateInterval("2024-02-29T00:00:00Z", "2024-03-01T00:00:00Z").start)
      .toBe("2024-02-29T00:00:00.000Z");
    expect(() => validateInterval("2023-02-29T00:00:00Z", "2023-03-01T00:00:00Z"))
      .toThrow("Fecha ISO 8601 inválida o sin zona horaria");
  });

  it("normalizes offset boundary cases to the corresponding UTC date", () => {
    expect(validateInterval("2026-01-01T00:00:00+14:00", "2025-12-31T23:59:59-12:00"))
      .toEqual({ start: "2025-12-31T10:00:00.000Z", end: "2026-01-01T11:59:59.000Z" });
    expect(validateInterval("2026-01-01T00:00:00-14:00", "2026-01-01T00:00:01-14:00").start)
      .toBe("2026-01-01T14:00:00.000Z");
  });

  it("rejects impossible calendar dates and malformed offset boundaries", () => {
    for (const date of ["2026-04-31T10:00:00Z", "2026-13-01T10:00:00Z", "2026-01-01T24:00:00Z"]) {
      expect(() => validateInterval(date, "2027-01-01T00:00:00Z"))
        .toThrow("Fecha ISO 8601 inválida o sin zona horaria");
    }
    for (const offset of ["+14:01", "-14:01", "+00:60"]) {
      expect(() => validateInterval(`2026-01-01T00:00:00${offset}`, "2026-01-02T00:00:00Z"))
        .toThrow("Fecha ISO 8601 inválida o sin zona horaria");
    }
  });

  it.each([
    [{ ...validInput, equipmentId: "XYZ-00" }, "Unidad inexistente"],
    [{ ...validInput, requester: "   " }, "El solicitante es obligatorio"],
    [{ ...validInput, start: "2026-11-02T10:00:00" }, "Fecha ISO 8601 inválida o sin zona horaria"],
    [{ ...validInput, start: "2026-02-30T10:00:00Z" }, "Fecha ISO 8601 inválida o sin zona horaria"],
    [{ ...validInput, start: "2026-11-02T10:00:00+25:00" }, "Fecha ISO 8601 inválida o sin zona horaria"],
    [{ ...validInput, start: validInput.end }, "El inicio debe ser anterior al fin"],
    [{ ...validInput, start: "2026-11-02T12:00:00Z", end: "2026-11-02T11:00:00Z" }, "El inicio debe ser anterior al fin"],
  ])("rejects invalid reservation input", (input, message) => {
    expect(() => validateReservation(input)).toThrow(message);
  });
});

describe("availability", () => {
  const existing = validateReservation(validInput);

  it("detects partial overlap", () => {
    const requested = validateReservation({ ...validInput, id: "r-2", start: "2026-11-02T10:30:00-03:00", end: "2026-11-02T11:30:00-03:00" });
    expect(intervalsOverlap(existing, requested)).toBe(true);
    expect(isAvailable("MIC-01", requested.start, requested.end, [existing])).toBe(false);
  });

  it("allows consecutive intervals at either boundary", () => {
    const after = validateReservation({ ...validInput, id: "r-2", start: validInput.end, end: "2026-11-02T12:00:00-03:00" });
    const before = validateReservation({ ...validInput, id: "r-3", start: "2026-11-02T09:00:00-03:00", end: validInput.start });
    expect(intervalsOverlap(existing, after)).toBe(false);
    expect(intervalsOverlap(before, existing)).toBe(false);
    expect(isAvailable("MIC-01", after.start, after.end, [existing])).toBe(true);
  });

  it("allows the same interval for a different physical unit", () => {
    expect(isAvailable("MIC-02", existing.start, existing.end, [existing])).toBe(true);
  });

  it("ignores cancelled reservations", () => {
    const cancelled = { ...existing, status: "CANCELLED" as const };
    expect(isAvailable("MIC-01", existing.start, existing.end, [cancelled])).toBe(true);
  });

  it("rejects an invalid interval or unit in availability queries", () => {
    expect(() => isAvailable("XYZ-00", existing.start, existing.end, [])).toThrow("Unidad inexistente");
    expect(() => isAvailable("MIC-01", existing.end, existing.start, [])).toThrow("El inicio debe ser anterior al fin");
  });
});
