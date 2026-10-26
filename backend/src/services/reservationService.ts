import { randomUUID } from "node:crypto";
import type { SqliteDatabase } from "../db/database";
import { EQUIPMENT, isEquipmentId } from "../domain/equipment";
import { isAvailable, validateInterval, validateReservation } from "../domain/reservation";
import { ReservationRepository } from "../repositories/reservationRepository";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export class ReservationService {
  private readonly repository: ReservationRepository;

  constructor(private readonly database: SqliteDatabase) {
    this.repository = new ReservationRepository(database);
  }

  listEquipment() {
    return EQUIPMENT;
  }

  availability(equipmentId: unknown, start: string, end: string) {
    if (!isEquipmentId(equipmentId)) throw new HttpError(400, "Unidad inexistente");
    const interval = validateInterval(start, end);
    this.assertFutureStart(interval.start);
    return {
      equipmentId,
      start: interval.start,
      end: interval.end,
      available: isAvailable(equipmentId, interval.start, interval.end, this.repository.list()),
    };
  }

  create(input: { equipmentId: unknown; requester: string; start: string; end: string }) {
    const reservation = validateReservation({ ...input, id: randomUUID() });
    this.assertFutureStart(reservation.start);
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.assertFutureStart(reservation.start);
      if (!isAvailable(reservation.equipmentId, reservation.start, reservation.end, this.repository.list())) {
        throw new HttpError(409, "La unidad ya está reservada para ese intervalo");
      }
      this.repository.insert(reservation);
      this.database.exec("COMMIT");
      return reservation;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  cancel(id: string) {
    const reservation = this.repository.findById(id);
    if (!reservation) throw new HttpError(404, "Reserva inexistente");
    if (reservation.status === "CANCELLED") throw new HttpError(409, "La reserva ya está cancelada");
    this.repository.cancel(id);
    return this.repository.findById(id)!;
  }

  listReservations() {
    return this.repository.list();
  }

  private assertFutureStart(start: string) {
    if (Date.parse(start) < Date.now()) {
      throw new HttpError(400, "El horario de inicio ya pasó. Elegí una fecha y hora futura en Buenos Aires.");
    }
  }
}
