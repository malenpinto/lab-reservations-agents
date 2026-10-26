const TIME_ZONE = "America/Argentina/Buenos_Aires";
const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function zonedParts(instant: number) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(instant).map(({ type, value }) => [type, value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute),
  };
}

function offsetAt(instant: number) {
  const local = zonedParts(instant);
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  return (localAsUtc - Math.floor(instant / 60_000) * 60_000) / 60_000;
}

export function buenosAiresInputToIso(date: string, time: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("Completá una fecha y un horario válidos.");
  }
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offset = offsetAt(wallAsUtc);
  const instant = wallAsUtc - offset * 60_000;
  const actual = zonedParts(instant);
  if (actual.year !== year || actual.month !== month || actual.day !== day || actual.hour !== hour || actual.minute !== minute) {
    throw new Error("Ese horario no existe en Buenos Aires para la fecha seleccionada.");
  }
  const sign = offset < 0 ? "-" : "+";
  const absoluteOffset = Math.abs(offset);
  const offsetText = `${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, "0")}:${String(absoluteOffset % 60).padStart(2, "0")}`;
  return `${date}T${time}:00${offsetText}`;
}

export function formatBuenosAires(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function todayInBuenosAires() {
  const { year, month, day } = zonedParts(Date.now());
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
