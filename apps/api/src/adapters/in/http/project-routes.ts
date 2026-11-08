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

      const request = await submitProjectEditRequest.execute(
        usuarioAutenticado(res),
        projectId,
        {
          ...(leerTextoOpcional(cuerpo, "title") === undefined
            ? {}
            : { title: leerTextoOpcional(cuerpo, "title") }),

          ...(leerTextoOpcional(cuerpo, "description") === undefined
            ? {}
            : { description: leerTextoOpcional(cuerpo, "description") }),

          ...(leerTextoOpcional(cuerpo, "vertical") === undefined
            ? {}
            : { vertical: leerTextoOpcional(cuerpo, "vertical") }),

          ...(leerTextosOpcional(cuerpo, "businessSectors") === undefined
            ? {}
            : {
                businessSectors: leerTextosOpcional(cuerpo, "businessSectors"),
              }),

          ...(leerTextoOpcional(cuerpo, "projectStage") === undefined
            ? {}
            : { projectStage: leerTextoOpcional(cuerpo, "projectStage") }),
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
