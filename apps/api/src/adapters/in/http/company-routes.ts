import { Router } from "express";
import type { RegisterCompany } from "../../../application/ports/in/register-company.js";
import { leerCuerpo, leerListaDeTextos, leerTexto } from "./cuerpo.js";
import { companyToResponse } from "./respuestas.js";

export function companyRoutes(registerCompany: RegisterCompany): Router {
  const router = Router();

  router.post("/register", async (req, res) => {
    const cuerpo = leerCuerpo(req.body);
    const company = await registerCompany.execute({
      email: leerTexto(cuerpo, "email"),
      password: leerTexto(cuerpo, "password"),
      firstName: leerTexto(cuerpo, "firstName"),
      lastName: leerTexto(cuerpo, "lastName"),
      jobPosition: leerTexto(cuerpo, "jobPosition"),
      companyName: leerTexto(cuerpo, "companyName"),
      country: leerTexto(cuerpo, "country"),
      businessSector: leerTexto(cuerpo, "businessSector"),
      interests: leerListaDeTextos(cuerpo, "interests"),
    });
    res.status(201).json(companyToResponse(company));
  });

  return router;
}
