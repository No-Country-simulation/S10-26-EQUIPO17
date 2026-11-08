import { Router } from "express";

import type { Authenticate } from "../../../application/ports/in/authenticate.js";
import type { ReviewProjectEditRequest } from "../../../application/ports/in/review-project-edit-request.js";

import { autenticar, usuarioAutenticado } from "./autenticar.js";
import { leerCuerpo, leerTextoOpcional, leerParametroRuta } from "./cuerpo.js";
import { projectEditRequestToResponse } from "./respuestas.js";

export function projectEditRequestRoutes(
  reviewProjectEditRequest: ReviewProjectEditRequest,
  authenticate: Authenticate,
): Router {
  const router = Router();

  router.post("/:id/approve", autenticar(authenticate), async (req, res) => {
    const requestId = leerParametroRuta(req.params.id, "id");

    const request = await reviewProjectEditRequest.execute(
      usuarioAutenticado(res),
      requestId,
      { type: "approve" },
    );

    res.json(projectEditRequestToResponse(request));
  });

  router.post("/:id/reject", autenticar(authenticate), async (req, res) => {
    const cuerpo = req.body === undefined ? {} : leerCuerpo(req.body);

    const reason = leerTextoOpcional(cuerpo, "reason");

    const requestId = leerParametroRuta(req.params.id, "id");

    const request = await reviewProjectEditRequest.execute(
      usuarioAutenticado(res),
      requestId,
      {
        type: "reject",
        ...(reason === undefined ? {} : { reason }),
      },
    );

    res.json(projectEditRequestToResponse(request));
  });

  return router;
}
