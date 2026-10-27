import express, { type Express } from "express";
import { manejadorDeErrores } from "../../adapters/in/http/manejador-de-errores.js";
import { companyRoutes } from "../../adapters/in/http/company-routes.js";
import { userRoutes } from "../../adapters/in/http/user-routes.js";
import type { CasosDeUso } from "../container.js";

export function crearApp(casos: CasosDeUso): Express {
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/users", userRoutes(casos.registerUser));
  app.use("/companies", companyRoutes(casos.createCompany, casos.getCompany));

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });
  app.use(manejadorDeErrores);
  return app;
}
