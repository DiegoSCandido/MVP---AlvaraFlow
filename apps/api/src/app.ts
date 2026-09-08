import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigins } from "./lib/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { clientesRoutes } from "./modules/clientes/clientes.routes.js";
import { alvarasRoutes } from "./modules/alvaras/alvaras.routes.js";
import { taxasRoutes } from "./modules/taxas/taxas.routes.js";
import { documentosRoutes } from "./modules/documentos/documentos.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/clientes", clientesRoutes);
  app.use("/api/alvaras", alvarasRoutes);
  app.use("/api/taxas", taxasRoutes);
  app.use("/api/documentos", documentosRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
