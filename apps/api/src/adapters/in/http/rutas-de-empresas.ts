import { Router } from "express";
import type { CrearEmpresa } from "../../../application/ports/in/crear-empresa.js";
import type { ObtenerEmpresa } from "../../../application/ports/in/obtener-empresa.js";
import { leerCuerpo, leerTexto, leerTextoOpcional } from "./cuerpo.js";
import { empresaARespuesta } from "./respuestas.js";

export function rutasDeEmpresas(
  crearEmpresa: CrearEmpresa,
  obtenerEmpresa: ObtenerEmpresa,
): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const cuerpo = leerCuerpo(req.body);
    const empresa = await crearEmpresa.ejecutar({
      nombre: leerTexto(cuerpo, "nombre"),
      pais: leerTexto(cuerpo, "pais"),
      usuarioId: leerTextoOpcional(cuerpo, "usuarioId"),
    });
    res.status(201).json(empresaARespuesta(empresa));
  });

  router.get("/:id", async (req, res) => {
    const empresa = await obtenerEmpresa.ejecutar(req.params.id);
    res.json(empresaARespuesta(empresa));
  });

  return router;
}
