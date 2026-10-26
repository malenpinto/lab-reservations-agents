import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { openDatabase } from "../db/database";

const input = {
  equipmentId: "MIC-01",
  requester: "Ada Lovelace",
  start: "2026-11-02T10:00:00-03:00",
  end: "2026-11-02T11:00:00-03:00",
};

const databases: ReturnType<typeof openDatabase>[] = [];
const temporaryDirectories: string[] = [];

function memoryApp() {
  const database = openDatabase(":memory:");
  databases.push(database);
  return createApp(database);
}

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("reservations API", () => {
  it("returns the fixed inventory and validates availability", async () => {
    const app = memoryApp();
    const inventory = await request(app).get("/api/equipment").expect(200);
    expect(inventory.body).toHaveLength(5);
    await request(app)
      .get("/api/equipment/MIC-01/availability")
      .query({ start: input.start, end: input.end })
      .expect(200, { equipmentId: "MIC-01", start: "2026-11-02T13:00:00.000Z", end: "2026-11-02T14:00:00.000Z", available: true });
  });

  it("creates a valid reservation and rejects invalid inputs", async () => {
    const app = memoryApp();
    const created = await request(app).post("/api/reservations").send(input).expect(201);
    expect(created.body).toMatchObject({
      equipmentId: input.equipmentId,
      requester: input.requester,
      start: "2026-11-02T13:00:00.000Z",
      end: "2026-11-02T14:00:00.000Z",
      status: "ACTIVE",
    });
    await request(app).post("/api/reservations").send({ ...input, requester: "   " }).expect(400);
    await request(app).post("/api/reservations").send({ ...input, equipmentId: "XYZ-00" }).expect(400);
  });

  it("rejects overlapping requests, including simultaneous submissions", async () => {
    const app = memoryApp();
    const responses = await Promise.all([
      request(app).post("/api/reservations").send(input),
      request(app).post("/api/reservations").send(input),
    ]);
    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
    await request(app).post("/api/reservations").send({
      ...input,
      start: "2026-11-02T10:30:00-03:00",
      end: "2026-11-02T11:30:00-03:00",
    }).expect(409);
  });

  it("allows consecutive reservations and reservations for another unit", async () => {
    const app = memoryApp();
    await request(app).post("/api/reservations").send(input).expect(201);
    await request(app).post("/api/reservations").send({
      ...input,
      start: input.end,
      end: "2026-11-02T12:00:00-03:00",
    }).expect(201);
    await request(app).post("/api/reservations").send({ ...input, equipmentId: "MIC-02" }).expect(201);
  });

  it("cancels without deleting history and frees the interval", async () => {
    const app = memoryApp();
    const created = await request(app).post("/api/reservations").send(input).expect(201);
    await request(app).post(`/api/reservations/${created.body.id}/cancel`).expect(200).expect(({ body }) => {
      expect(body.status).toBe("CANCELLED");
    });
    await request(app).post("/api/reservations").send(input).expect(201);
    const history = await request(app).get("/api/reservations").expect(200);
    expect(history.body.map((reservation: { status: string }) => reservation.status).sort()).toEqual(["ACTIVE", "CANCELLED"]);
    await request(app).post(`/api/reservations/${created.body.id}/cancel`).expect(409);
    await request(app).post("/api/reservations/not-found/cancel").expect(404);
  });

  it("preserves active and cancelled reservations after reopening the database", async () => {
    const directory = mkdtempSync(join(tmpdir(), "lab-reservations-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "reservations.sqlite");
    let database = openDatabase(path);
    let app = createApp(database);
    const active = await request(app).post("/api/reservations").send(input).expect(201);
    const cancelled = await request(app).post("/api/reservations").send({ ...input, equipmentId: "OSC-01" }).expect(201);
    await request(app).post(`/api/reservations/${cancelled.body.id}/cancel`).expect(200);
    database.close();

    database = openDatabase(path);
    app = createApp(database);
    databases.push(database);
    const history = await request(app).get("/api/reservations").expect(200);
    expect(history.body).toHaveLength(2);
    expect(history.body.find((reservation: { id: string }) => reservation.id === active.body.id).status).toBe("ACTIVE");
    expect(history.body.find((reservation: { id: string }) => reservation.id === cancelled.body.id).status).toBe("CANCELLED");
  });
});
