import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { env } from "../lib/env.js";
import { badRequest } from "../lib/http-error.js";

export const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const TIPOS_PERMITIDOS = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // Nome no disco e opaco; o nome original fica no banco.
    cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
      return cb(badRequest(`Tipo de arquivo nao suportado: ${file.mimetype}`));
    }
    cb(null, true);
  },
});
