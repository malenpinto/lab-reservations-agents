export const EQUIPMENT = [
  { id: "MIC-01", name: "Microscopio digital" },
  { id: "MIC-02", name: "Microscopio digital" },
  { id: "OSC-01", name: "Osciloscopio" },
  { id: "MUL-01", name: "Multímetro" },
  { id: "FUE-01", name: "Fuente de alimentación" },
] as const;

export type EquipmentId = (typeof EQUIPMENT)[number]["id"];

export function isEquipmentId(value: unknown): value is EquipmentId {
  return typeof value === "string" && EQUIPMENT.some(({ id }) => id === value);
}
