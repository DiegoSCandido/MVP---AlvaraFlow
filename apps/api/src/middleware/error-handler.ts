import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { env } from "../lib/env.js";
import { HttpError } from "../lib/http-error.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Rota nao encontrada: ${req.method} ${req.originalUrl}` });
}

/** Converte erros conhecidos (Zod, Multer, Prisma, HttpError) em respostas JSON estaveis. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados invalidos",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Arquivo acima do tamanho maximo permitido" : err.message;
    return res.status(400).json({ error: message });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  // Violacao de unicidade do Prisma (ex.: CNPJ ou e-mail repetido).
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
    return res.status(409).json({ error: "Ja existe um registro com esse valor unico" });
  }

  console.error("[erro nao tratado]", err);
  return res.status(500).json({
    error: "Erro interno do servidor",
    ...(env.NODE_ENV === "development" && err instanceof Error ? { stack: err.stack } : {}),
  });
}
