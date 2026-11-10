import { Router, type CookieOptions, type Response } from "express";
import type { Authenticate } from "../../../application/ports/in/authenticate.js";
import type { LogIn, Session } from "../../../application/ports/in/log-in.js";
import type { LogOut } from "../../../application/ports/in/log-out.js";
import type { RefreshUserSession } from "../../../application/ports/in/refresh-user-session.js";
import { NoAutenticadoError } from "../../../domain/errors.js";
import type { OpcionesDeCookie } from "../../../infrastructure/config/env.js";
import { API_PREFIX } from "./api-prefix.js";
import { autenticar, usuarioAutenticado } from "./autenticar.js";
import { leerCuerpo, leerTexto } from "./cuerpo.js";
import { authenticatedUserToResponse, sessionToResponse } from "./respuestas.js";

/**
 * Supabase refresh tokens do not expire on their own; this caps how long a session can go
 * unused, since every refresh writes the cookie again.
 */
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const ACCESS_TOKEN_PATH = API_PREFIX;
// Only sent to /api/auth, where refreshing and logging out live.
const REFRESH_TOKEN_PATH = `${API_PREFIX}/auth`;

export function authRoutes(
  logIn: LogIn,
  refreshUserSession: RefreshUserSession,
  logOut: LogOut,
  authenticate: Authenticate,
  cookies: OpcionesDeCookie,
): Router {
  const router = Router();
  // HttpOnly: the tokens never reach the frontend's JavaScript.
  const base: CookieOptions = { httpOnly: true, secure: cookies.secure, sameSite: cookies.sameSite };

  const guardarSesion = (res: Response, session: Session) => {
    res.cookie("access_token", session.accessToken, {
      ...base,
      path: ACCESS_TOKEN_PATH,
      maxAge: session.expiresIn * 1000,
    });
    res.cookie("refresh_token", session.refreshToken, {
      ...base,
      path: REFRESH_TOKEN_PATH,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
  };

  // The browser only removes a cookie when the path matches the one it was stored with.
  const borrarSesion = (res: Response) => {
    res.clearCookie("access_token", { ...base, path: ACCESS_TOKEN_PATH });
    res.clearCookie("refresh_token", { ...base, path: REFRESH_TOKEN_PATH });
  };

  router.post("/login", async (req, res) => {
    const cuerpo = leerCuerpo(req.body);
    const session = await logIn.execute({
      email: leerTexto(cuerpo, "email"),
      password: leerTexto(cuerpo, "password"),
    });

    guardarSesion(res, session);
    res.json(sessionToResponse(session));
  });

  // Needs no access token: this route exists for when it has already expired.
  router.post("/refresh", async (req, res) => {
    try {
      // cookie-parser turns "j:" values into objects, so the type has to be checked.
      const token: unknown = req.cookies.refresh_token;
      if (typeof token !== "string" || token === "") {
        throw new NoAutenticadoError();
      }
      const session = await refreshUserSession.execute(token);

      guardarSesion(res, session);
      res.json(sessionToResponse(session));
    } catch (error) {
      // An outage is not a refusal: the cookies stay, so the user can retry.
      if (error instanceof NoAutenticadoError) borrarSesion(res);
      throw error;
    }
  });

  // Needs no valid session either: it always answers 204 and clears the cookies, so logging out
  // twice, or with an expired session, is not an error.
  router.post("/logout", async (req, res) => {
    const token: unknown = req.cookies.access_token;
    if (typeof token === "string" && token !== "") {
      try {
        await logOut.execute(token);
      } catch (error) {
        // An outage must not keep the user logged in on this browser.
        console.error(error);
      }
    }

    borrarSesion(res);
    res.status(204).end();
  });

  // Reads the identity from the access token without rotating anything. A 401 leaves the cookies
  // alone: the frontend can still try /refresh with the refresh token.
  router.get("/me", autenticar(authenticate), (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(authenticatedUserToResponse(usuarioAutenticado(res)));
  });

  return router;
}
