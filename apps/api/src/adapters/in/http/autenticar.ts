import type { RequestHandler, Response } from "express";
import type { Authenticate } from "../../../application/ports/in/authenticate.js";
import type { AuthenticatedUser } from "../../../application/ports/out/auth-provider.js";
import { NoAutenticadoError } from "../../../domain/errors.js";

/** Only says who is calling; what they are allowed to do is decided by each use case. */
export function autenticar(authenticate: Authenticate): RequestHandler {
  return async (req, res, next) => {
    // cookie-parser turns "j:" values into objects, so the type has to be checked.
    const token: unknown = req.cookies.access_token;
    if (typeof token !== "string" || token === "") {
      throw new NoAutenticadoError();
    }
    res.locals.usuario = await authenticate.execute(token);
    next();
  };
}

/** The user `autenticar` left in the response; only for routes that run behind it. */
export const usuarioAutenticado = (res: Response): AuthenticatedUser =>
  res.locals.usuario as AuthenticatedUser;
