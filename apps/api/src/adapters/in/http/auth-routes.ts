import { Router, type CookieOptions } from "express";
import type { LogIn } from "../../../application/ports/in/log-in.js";
import type { OpcionesDeCookie } from "../../../infrastructure/config/env.js";
import { leerCuerpo, leerTexto } from "./cuerpo.js";
import { sessionToResponse } from "./respuestas.js";

/** Supabase refresh tokens do not expire on their own; this caps how long a login lasts. */
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function authRoutes(logIn: LogIn, cookies: OpcionesDeCookie): Router {
  const router = Router();
  // HttpOnly: the tokens never reach the frontend's JavaScript.
  const base: CookieOptions = { httpOnly: true, secure: cookies.secure, sameSite: cookies.sameSite };

  router.post("/login", async (req, res) => {
    const cuerpo = leerCuerpo(req.body);
    const session = await logIn.execute({
      email: leerTexto(cuerpo, "email"),
      password: leerTexto(cuerpo, "password"),
    });

    res.cookie("access_token", session.accessToken, {
      ...base,
      path: "/",
      maxAge: session.expiresIn * 1000,
    });
    // Only sent to /auth, where refreshing and logging out will live.
    res.cookie("refresh_token", session.refreshToken, {
      ...base,
      path: "/auth",
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
    res.json(sessionToResponse(session));
  });

  return router;
}
