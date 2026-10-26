export interface Equipment {
  id: string;
  name: string;
}

export type ReservationStatus = "ACTIVE" | "CANCELLED";

export interface Reservation {
  id: string;
  equipmentId: string;
  requester: string;
  start: string;
  end: string;
  status: ReservationStatus;
}

export interface Availability {
  equipmentId: string;
  start: string;
  end: string;
  available: boolean;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function callApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error ?? "No se pudo completar la solicitud", response.status);
  return body as T;
}

export const api = {
  equipment: () => callApi<Equipment[]>("/equipment"),
  reservations: () => callApi<Reservation[]>("/reservations"),
  availability: (equipmentId: string, start: string, end: string) =>
    callApi<Availability>(`/equipment/${encodeURIComponent(equipmentId)}/availability?${new URLSearchParams({ start, end })}`),
  createReservation: (reservation: { equipmentId: string; requester: string; start: string; end: string }) =>
    callApi<Reservation>("/reservations", { method: "POST", body: JSON.stringify(reservation) }),
  cancelReservation: (id: string) =>
    callApi<Reservation>(`/reservations/${encodeURIComponent(id)}/cancel`, { method: "POST" }),
};
