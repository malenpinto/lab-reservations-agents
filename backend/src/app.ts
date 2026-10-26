import express from "express";
import type { SqliteDatabase } from "./db/database";
import { createReservationRouter, errorHandler } from "./routes/reservationRoutes";

export function createApp(database: SqliteDatabase) {
  const app = express();
  app.use(express.json());
  app.use("/api", createReservationRouter(database));
  app.use(errorHandler);
  return app;
}
