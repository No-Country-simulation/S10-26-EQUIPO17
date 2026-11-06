import { Router } from "express";
import type { Authenticate } from "../../../application/ports/in/authenticate.js";
import type { UploadProject } from "../../../application/ports/in/upload-project.js";
import { autenticar, usuarioAutenticado } from "./autenticar.js";
import { leerCuerpo, leerTexto, leerTextos } from "./cuerpo.js";
import { projectToResponse } from "./respuestas.js";

export function projectRoutes(uploadProject: UploadProject, authenticate: Authenticate): Router {
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

  return router;
}
