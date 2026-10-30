import cors from "cors";
import express, { type Express } from "express";
import { manejadorDeErrores } from "../../adapters/in/http/manejador-de-errores.js";
import { authRoutes } from "../../adapters/in/http/auth-routes.js";
import { companyRoutes } from "../../adapters/in/http/company-routes.js";
import type { Config } from "../config/env.js";
import type { CasosDeUso } from "../container.js";

export type OpcionesHttp = Pick<Config, "cookies" | "corsOrigins">;

export function crearApp(casos: CasosDeUso, { cookies, corsOrigins }: OpcionesHttp): Express {
  const app = express();
  // Only origins exactly equal to an allowed one get CORS headers (the request's own Origin is
  // echoed back). Any other origin gets none at all, so the browser hides the response.
  // Every response depends on Origin, so caches must never reuse one across origins.
  app.use((_req, res, next) => {
    res.vary("Origin");
    next();
  });
  app.use(
    cors((req, callback) => {
      const origin = req.header("Origin");
      callback(null, {
        origin: origin !== undefined && corsOrigins.includes(origin),
        credentials: true,
      });
    }),
  );
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/auth", authRoutes(casos.logIn, cookies));
  app.use("/companies", companyRoutes(casos.registerCompany));

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });
  app.use(manejadorDeErrores);
  return app;
}
