import { Router } from "express";
import type { CreateCompany } from "../../../application/ports/in/create-company.js";
import type { GetCompany } from "../../../application/ports/in/get-company.js";
import type { RegisterCompany } from "../../../application/ports/in/register-company.js";
import { leerCuerpo, leerListaDeTextos, leerTexto, leerTextoOpcional } from "./cuerpo.js";
import { companyToResponse } from "./respuestas.js";

export function companyRoutes(
  createCompany: CreateCompany,
  getCompany: GetCompany,
  registerCompany: RegisterCompany,
): Router {
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

  router.post("/", async (req, res) => {
    const cuerpo = leerCuerpo(req.body);
    const company = await createCompany.execute({
      firstName: leerTexto(cuerpo, "firstName"),
      lastName: leerTexto(cuerpo, "lastName"),
      jobPosition: leerTexto(cuerpo, "jobPosition"),
      companyName: leerTexto(cuerpo, "companyName"),
      country: leerTexto(cuerpo, "country"),
      businessSector: leerTexto(cuerpo, "businessSector"),
      interests: leerListaDeTextos(cuerpo, "interests"),
      userId: leerTextoOpcional(cuerpo, "userId"),
    });
    res.status(201).json(companyToResponse(company));
  });

  router.get("/:id", async (req, res) => {
    const company = await getCompany.execute(req.params.id);
    res.json(companyToResponse(company));
  });

  return router;
}
