import express, { type Express } from "express";
import { limits } from "../../../packages/contracts/src/index";
import type { ApiConfig } from "./config";
import type { SqlClient } from "./db/client";
import { createAdminRouter } from "./routes/admin";
import { createV1Router } from "./routes/v1";

export function createApp(client: SqlClient, config: ApiConfig): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.use(express.json({ limit: limits.maxBodyBytes }));

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.use("/v1", createV1Router(client));
  app.use("/admin", createAdminRouter(client, config));

  // Cuerpo malformado o límite excedido: responder JSON en vez del HTML de
  // Express, porque el único consumidor es una extensión que espera JSON.
  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      if (response.headersSent) {
        next(error);
        return;
      }
      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
          ? (error as { status: number }).status
          : 500;
      response.status(status === 0 ? 500 : status).json({
        error: status === 500 ? "Error interno." : "Cuerpo inválido.",
      });
    },
  );

  return app;
}
