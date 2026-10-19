import express, { type Express } from "express";
import { manejadorDeErrores } from "../../adapters/in/http/manejador-de-errores.js";
import { rutasDeEmpresas } from "../../adapters/in/http/rutas-de-empresas.js";
import { rutasDeUsuarios } from "../../adapters/in/http/rutas-de-usuarios.js";
import type { CasosDeUso } from "../container.js";

export function crearApp(casos: CasosDeUso): Express {
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/usuarios", rutasDeUsuarios(casos.registrarUsuario));
  app.use("/empresas", rutasDeEmpresas(casos.crearEmpresa, casos.obtenerEmpresa));

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });
  app.use(manejadorDeErrores);
  return app;
}
