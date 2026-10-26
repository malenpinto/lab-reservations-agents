import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import type { SqliteDatabase } from "../db/database";
import { HttpError, ReservationService } from "../services/reservationService";

function asyncRoute(
  handler: (request: Request, response: Response) => unknown,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = handler(request, response);
      if (result instanceof Promise) result.catch(next);
    } catch (error) {
      next(error);
    }
  };
}

export function createReservationRouter(database: SqliteDatabase): Router {
  const router = Router();
  const service = new ReservationService(database);

  router.get("/equipment", (_request, response) => response.json(service.listEquipment()));
  router.get("/equipment/:id/availability", asyncRoute((request, response) => {
    response.json(service.availability(request.params.id, request.query.start as string, request.query.end as string));
  }));
  router.post("/reservations", asyncRoute((request, response) => {
    response.status(201).json(service.create(request.body));
  }));
  router.post("/reservations/:id/cancel", asyncRoute((request, response) => {
    const id = request.params.id;
    response.json(service.cancel(Array.isArray(id) ? id[0] : id));
  }));
  router.get("/reservations", (_request, response) => response.json(service.listReservations()));

  return router;
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof Error) {
    response.status(400).json({ error: error.message });
    return;
  }
  response.status(500).json({ error: "Error interno del servidor" });
}
