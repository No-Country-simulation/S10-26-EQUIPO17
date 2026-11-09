import { Router } from "express";

import type { Authenticate } from "../../../application/ports/in/authenticate.js";
import type { ReviewProjectEditRequest } from "../../../application/ports/in/review-project-edit-request.js";

import { autenticar, usuarioAutenticado } from "./autenticar.js";
import { leerCuerpo, leerTextoOpcional, leerParametroRuta } from "./cuerpo.js";
import { projectEditRequestToResponse } from "./respuestas.js";
import type { ListPendingProjectEditRequests } from "../../../application/ports/in/list-pending-project-edit-requests.js";

export function projectEditRequestRoutes(
  listPendingProjectEditRequests: ListPendingProjectEditRequests,
  reviewProjectEditRequest: ReviewProjectEditRequest,
  authenticate: Authenticate,
): Router {
  const router = Router();
  //authenticates user,
  //pass identity to the use case
  //converts each returned entity to the existing HTTP response format.
  router.get("/", autenticar(authenticate), async (_req, res) => {
    const requests = await listPendingProjectEditRequests.execute(
      usuarioAutenticado(res),
    );

    res.json(requests.map(projectEditRequestToResponse));
  });

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
