import { Router } from "express";
import type { Authenticate } from "../../../application/ports/in/authenticate.js";
import type { UploadProject } from "../../../application/ports/in/upload-project.js";
import { autenticar, usuarioAutenticado } from "./autenticar.js";
import {
  leerCuerpo,
  leerTexto,
  leerTextos,
  leerTextoOpcional,
  leerTextosOpcional,
  leerParametroRuta,
} from "./cuerpo.js";
import { projectToResponse } from "./respuestas.js";
import type { ListProjects } from "../../../application/ports/in/list-projects.js";
import type { SubmitProjectEditRequest } from "../../../application/ports/in/submit-project-edit-request.js";
import { projectEditRequestToResponse } from "./respuestas.js";

export function projectRoutes(
  uploadProject: UploadProject,
  listProjects: ListProjects,
  submitProjectEditRequest: SubmitProjectEditRequest,
  authenticate: Authenticate,
): Router {
  const router = Router();
  router.get("/", autenticar(authenticate), async (_req, res) => {
    const projects = await listProjects.execute(usuarioAutenticado(res));

    res.json(projects.map(projectToResponse));
  });
  router.post(
    "/:projectId/edit-requests",
    autenticar(authenticate),
    async (req, res) => {
      const cuerpo = leerCuerpo(req.body);

      const projectId = leerParametroRuta(req.params.projectId, "projectId");

      const title = leerTextoOpcional(cuerpo, "title");
      const description = leerTextoOpcional(cuerpo, "description");
      const vertical = leerTextoOpcional(cuerpo, "vertical");
      const businessSectors = leerTextosOpcional(cuerpo, "businessSectors");
      const projectStage = leerTextoOpcional(cuerpo, "projectStage");

      const request = await submitProjectEditRequest.execute(
        usuarioAutenticado(res),
        projectId,
        {
          ...(title === undefined ? {} : { title }),
          ...(description === undefined ? {} : { description }),
          ...(vertical === undefined ? {} : { vertical }),
          ...(businessSectors === undefined ? {} : { businessSectors }),
          ...(projectStage === undefined ? {} : { projectStage }),
        },
      );

      res.status(201).json(projectEditRequestToResponse(request));
    },
  );
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
