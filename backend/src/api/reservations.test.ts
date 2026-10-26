import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { openDatabase } from "../db/database";

function futureInput() {
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  startDate.setUTCSeconds(0, 0);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  return {
    equipmentId: "MIC-01",
    requester: "Ada Lovelace",
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

const databases: ReturnType<typeof openDatabase>[] = [];
const temporaryDirectories: string[] = [];

function memoryDatabase() {
  const database = openDatabase(":memory:");
  databases.push(database);
  return database;
}

function memoryApp() {
  return createApp(memoryDatabase());
}

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("reservations API", () => {
  it("returns the fixed inventory and validates future availability", async () => {
    const app = memoryApp();
    const input = futureInput();
    const inventory = await request(app).get("/api/equipment").expect(200);
    expect(inventory.body).toHaveLength(5);
    await request(app)
      .get("/api/equipment/MIC-01/availability")
      .query({ start: input.start, end: input.end })
      .expect(200, {
        equipmentId: "MIC-01",
        start: input.start,
        end: input.end,
        available: true,
      });
  });

  it("rejects past intervals consistently for availability and creation", async () => {
    const app = memoryApp();
    const past = {
      equipmentId: "MIC-01",
      requester: "Ada Lovelace",
      start: "2000-01-01T10:00:00-03:00",
      end: "2000-01-01T11:00:00-03:00",
    };
    const message = "El horario de inicio ya pasó. Elegí una fecha y hora futura en Buenos Aires.";
    await request(app).post("/api/reservations").send(past).expect(400, { error: message });
    await request(app)
      .get("/api/equipment/MIC-01/availability")
      .query({ start: past.start, end: past.end })
      .expect(400, { error: message });
  });

  it("creates a valid reservation and rejects invalid inputs", async () => {
    const app = memoryApp();
    const input = futureInput();
    const created = await request(app).post("/api/reservations").send(input).expect(201);
    expect(created.body).toMatchObject({
      equipmentId: input.equipmentId,
      requester: input.requester,
      start: input.start,
      end: input.end,
      status: "ACTIVE",
    });
    await request(app).post("/api/reservations").send({ ...input, requester: "   " }).expect(400);
    await request(app).post("/api/reservations").send({ ...input, equipmentId: "XYZ-00" }).expect(400);
  });

  it("rejects overlapping requests, including simultaneous submissions", async () => {
    const app = memoryApp();
    const input = futureInput();
    const responses = await Promise.all([
      request(app).post("/api/reservations").send(input),
      request(app).post("/api/reservations").send(input),
    ]);
    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
    await request(app).post("/api/reservations").send({
      ...input,
      start: new Date(Date.parse(input.start) + 30 * 60 * 1000).toISOString(),
      end: new Date(Date.parse(input.end) + 30 * 60 * 1000).toISOString(),
    }).expect(409);
  });

  it("allows consecutive reservations and reservations for another unit", async () => {
    const app = memoryApp();
    const input = futureInput();
    await request(app).post("/api/reservations").send(input).expect(201);
    await request(app).post("/api/reservations").send({
      ...input,
      start: input.end,
      end: new Date(Date.parse(input.end) + 60 * 60 * 1000).toISOString(),
    }).expect(201);
    await request(app).post("/api/reservations").send({ ...input, equipmentId: "MIC-02" }).expect(201);
  });

  it("cancels without deleting history and frees the interval", async () => {
    const app = memoryApp();
    const input = futureInput();
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
    const input = futureInput();
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

  it("allows old reservations to remain visible in history", async () => {
    const database = memoryDatabase();
    database.prepare(`
      INSERT INTO reservations (id, equipment_id, requester, start, end, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run("legacy-reservation", "FUE-01", "Ada Lovelace", "2000-01-01T13:00:00.000Z", "2000-01-01T14:00:00.000Z", "ACTIVE");

    const history = await request(createApp(database)).get("/api/reservations").expect(200);
    expect(history.body).toHaveLength(1);
    expect(history.body[0]).toMatchObject({ id: "legacy-reservation", status: "ACTIVE" });
  });
});
