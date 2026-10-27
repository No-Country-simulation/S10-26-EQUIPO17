import { Router } from "express";
import type { RegisterUser } from "../../../application/ports/in/register-user.js";
import { leerCuerpo, leerTexto } from "./cuerpo.js";
import { userToResponse } from "./respuestas.js";

export function userRoutes(registerUser: RegisterUser): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const cuerpo = leerCuerpo(req.body);
    const user = await registerUser.execute({
      email: leerTexto(cuerpo, "email"),
      password: leerTexto(cuerpo, "password"),
    });
    res.status(201).json(userToResponse(user));
  });

  return router;
}
