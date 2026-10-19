import { Router } from "express";
import type { RegistrarUsuario } from "../../../application/ports/in/registrar-usuario.js";
import { leerCuerpo, leerTexto } from "./cuerpo.js";
import { usuarioARespuesta } from "./respuestas.js";

export function rutasDeUsuarios(registrarUsuario: RegistrarUsuario): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const cuerpo = leerCuerpo(req.body);
    const usuario = await registrarUsuario.ejecutar({
      correo: leerTexto(cuerpo, "correo"),
      clave: leerTexto(cuerpo, "clave"),
    });
    res.status(201).json(usuarioARespuesta(usuario));
  });

  return router;
}
