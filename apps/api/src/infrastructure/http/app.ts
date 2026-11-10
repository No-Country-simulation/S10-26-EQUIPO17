import cookieParser from "cookie-parser";
import express, { Router, type Express } from "express";
import { API_PREFIX } from "../../adapters/in/http/api-prefix.js";
import { manejadorDeErrores } from "../../adapters/in/http/manejador-de-errores.js";
import { authRoutes } from "../../adapters/in/http/auth-routes.js";
import { companyRoutes } from "../../adapters/in/http/company-routes.js";
import { projectRoutes } from "../../adapters/in/http/project-routes.js";
import type { Config } from "../config/env.js";
import type { CasosDeUso } from "../container.js";
import { projectEditRequestRoutes } from "../../adapters/in/http/project-edit-request-routes.js";

export type OpcionesHttp = Pick<Config, "cookies">;

// No CORS on purpose: the browser always reaches the API on the web's own origin, through the Vite
// dev proxy or the Vercel rewrite, so cross-origin requests are never needed and stay blocked.
export function crearApp(
  casos: CasosDeUso,
  { cookies }: OpcionesHttp,
): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const api = Router();
  api.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });
  api.use(
    "/auth",
    authRoutes(casos.logIn, casos.refreshUserSession, casos.logOut, casos.authenticate, cookies),
  );
  api.use("/companies", companyRoutes(casos.registerCompany));
  api.use(
    "/projects",
    projectRoutes(
      casos.uploadProject,
      casos.listProjects,
      casos.submitProjectEditRequest,
      casos.authenticate,
    ),
  );

  api.use(
    "/project-edit-requests",
    projectEditRequestRoutes(
      casos.listPendingProjectEditRequests,
      casos.reviewProjectEditRequest,
      casos.authenticate,
    ),
  );
  app.use(API_PREFIX, api);

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });
  app.use(manejadorDeErrores);
  return app;
}
