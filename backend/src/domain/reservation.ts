import { isEquipmentId, type EquipmentId } from "./equipment";

export type ReservationStatus = "ACTIVE" | "CANCELLED";

export interface Reservation {
  id: string;
  equipmentId: EquipmentId;
  requester: string;
  start: string;
  end: string;
  status: ReservationStatus;
}

export interface ReservationInput {
  id: string;
  equipmentId: unknown;
  requester: string;
  start: string;
  end: string;
}

export interface ValidatedInterval {
  start: string;
  end: string;
}

const ISO_WITH_TIME_ZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i;
const ISO_PARTS =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|([+-])(\d{2}):(\d{2}))$/i;

function parseInstant(value: string): number | null {
  if (!ISO_WITH_TIME_ZONE.test(value)) return null;
  const match = ISO_PARTS.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , , , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = Number(offsetHourText ?? 0);
  const offsetMinute = Number(offsetMinuteText ?? 0);

  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return null;
  if (offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0)) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return null;

  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

/** Validates zoned ISO timestamps and returns their equivalent UTC instants. */
export function validateInterval(startInput: string, endInput: string): ValidatedInterval {
  const start = parseInstant(startInput);
  const end = parseInstant(endInput);
  if (start === null || end === null) throw new Error("Fecha ISO 8601 inválida o sin zona horaria");
  if (start >= end) throw new Error("El inicio debe ser anterior al fin");
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}

export function validateReservation(input: ReservationInput): Reservation {
  if (!isEquipmentId(input.equipmentId)) throw new Error("Unidad inexistente");
  if (typeof input.requester !== "string" || input.requester.trim().length === 0) {
    throw new Error("El solicitante es obligatorio");
  }
  if (typeof input.id !== "string" || input.id.trim().length === 0) {
    throw new Error("El identificador es obligatorio");
  }

  return {
    id: input.id,
    equipmentId: input.equipmentId,
    requester: input.requester.trim(),
    ...validateInterval(input.start, input.end),
    status: "ACTIVE",
  };
}

/**
 * Checks half-open interval overlap: [start, end).
 * Precondition: both arguments contain valid intervals with start < end.
 */
export function intervalsOverlap(
  first: Pick<Reservation, "start" | "end">,
  second: Pick<Reservation, "start" | "end">,
): boolean {
  const firstStart = Date.parse(first.start);
  const firstEnd = Date.parse(first.end);
  const secondStart = Date.parse(second.start);
  const secondEnd = Date.parse(second.end);
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function isAvailable(
  equipmentId: unknown,
  start: string,
  end: string,
  reservations: readonly Reservation[],
): boolean {
  if (!isEquipmentId(equipmentId)) throw new Error("Unidad inexistente");
  const requested = validateInterval(start, end);
  return !reservations.some(
    (reservation) =>
      reservation.status === "ACTIVE" &&
      reservation.equipmentId === equipmentId &&
      intervalsOverlap(reservation, requested),
  );
}
