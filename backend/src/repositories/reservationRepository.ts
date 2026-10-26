import type { EquipmentId } from "../domain/equipment";
import type { Reservation, ReservationStatus } from "../domain/reservation";
import type { SqliteDatabase } from "../db/database";

interface ReservationRow {
  id: string;
  equipment_id: EquipmentId;
  requester: string;
  start: string;
  end: string;
  status: ReservationStatus;
}

function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    requester: row.requester,
    start: row.start,
    end: row.end,
    status: row.status,
  };
}

export class ReservationRepository {
  constructor(private readonly database: SqliteDatabase) {}

  list(): Reservation[] {
    const rows = this.database.prepare("SELECT * FROM reservations ORDER BY start, id").all() as unknown as ReservationRow[];
    return rows.map(toReservation);
  }

  findById(id: string): Reservation | undefined {
    const row = this.database.prepare("SELECT * FROM reservations WHERE id = ?").get(id) as ReservationRow | undefined;
    return row ? toReservation(row) : undefined;
  }

  insert(reservation: Reservation): void {
    this.database.prepare(`
      INSERT INTO reservations (id, equipment_id, requester, start, end, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      reservation.id,
      reservation.equipmentId,
      reservation.requester,
      reservation.start,
      reservation.end,
      reservation.status,
    );
  }

  cancel(id: string): boolean {
    const result = this.database.prepare(
      "UPDATE reservations SET status = 'CANCELLED' WHERE id = ? AND status = 'ACTIVE'",
    ).run(id);
    return result.changes > 0;
  }
}
