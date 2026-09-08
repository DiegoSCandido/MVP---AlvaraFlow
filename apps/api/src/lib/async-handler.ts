import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Encaminha rejeicoes de handlers async para o error handler do Express.
 * Evita repetir try/catch em cada rota.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
