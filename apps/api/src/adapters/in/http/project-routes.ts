import { Router } from "express";
import type { AcceptProject } from "../../../application/ports/in/accept-project.js";
import type { Authenticate } from "../../../application/ports/in/authenticate.js";
import type { UploadProject } from "../../../application/ports/in/upload-project.js";
import { ValidacionError } from "../../../domain/errors.js";
import { autenticar, usuarioAutenticado } from "./autenticar.js";
import { leerCuerpo, leerTexto, leerTextos } from "./cuerpo.js";
import { projectToResponse } from "./respuestas.js";

/** A path parameter that is not a single text cannot be a valid project id. */
function leerId(valor: unknown): string {
  if (typeof valor !== "string") {
    throw new ValidacionError("El id del proyecto debe ser un texto");
  }
  return valor;
}

export function projectRoutes(
  uploadProject: UploadProject,
  acceptProject: AcceptProject,
  authenticate: Authenticate,
): Router {
  const router = Router();

  router.post("/", autenticar(authenticate), async (req, res) => {
    const cuerpo = leerCuerpo(req.body);
    const project = await uploadProject.execute(usuarioAutenticado(res), {
      title: leerTexto(cuerpo, "title"),
      description: leerTexto(cuerpo, "description"),
      vertical: leerTexto(cuerpo, "vertical"),
      businessSectors: leerTextos(cuerpo, "businessSectors"),
      projectStage: leerTexto(cuerpo, "projectStage"),
    });
    res.status(201).json(projectToResponse(project));
  });

  router.patch("/:id/accept", autenticar(authenticate), async (req, res) => {
    const project = await acceptProject.execute(usuarioAutenticado(res), leerId(req.params.id));
    res.json(projectToResponse(project));
  });

  return router;
}