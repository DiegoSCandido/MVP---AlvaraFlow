import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest, notFound } from "../../lib/http-error.js";
import { requireAuth } from "../../middleware/auth.js";
import { upload, uploadDir } from "../../middleware/upload.js";

export const documentosRoutes = Router();

documentosRoutes.use(requireAuth);

documentosRoutes.get(
  "/cliente/:clienteId",
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.documento.findMany({
        where: { clienteId: req.params.clienteId },
        orderBy: { createdAt: "desc" },
      }),
    );
  }),
);

documentosRoutes.get(
  "/alvara/:alvaraId",
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.documento.findMany({
        where: { alvaraId: req.params.alvaraId },
        orderBy: { createdAt: "desc" },
      }),
    );
  }),
);

/** Anexa arquivos a um cliente ou a um alvara (exatamente um dos dois). */
documentosRoutes.post(
  "/upload",
  upload.array("files", 10),
  asyncHandler(async (req, res) => {
    const arquivos = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (arquivos.length === 0) throw badRequest("Nenhum arquivo enviado");

    const clienteId = typeof req.body.clienteId === "string" ? req.body.clienteId : null;
    const alvaraId = typeof req.body.alvaraId === "string" ? req.body.alvaraId : null;

    if (!clienteId === !alvaraId) {
      throw badRequest("Informe clienteId ou alvaraId (apenas um dos dois)");
    }

    const documentos = await prisma.$transaction(
      arquivos.map((arquivo) =>
        prisma.documento.create({
          data: {
            nomeOriginal: arquivo.originalname,
            mimeType: arquivo.mimetype,
            tamanho: arquivo.size,
            storageKey: arquivo.filename,
            clienteId,
            alvaraId,
            uploadedById: req.user!.id,
          },
        }),
      ),
    );

    res.status(201).json(documentos);
  }),
);

documentosRoutes.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const documento = await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!documento) throw notFound("Documento nao encontrado");

    // storageKey e gerado pelo servidor, mas o resolve + prefixo garante que
    // nenhum caminho escape da pasta de uploads.
    const caminho = path.resolve(uploadDir, documento.storageKey);
    if (!caminho.startsWith(uploadDir + path.sep) || !fs.existsSync(caminho)) {
      throw notFound("Arquivo indisponivel no armazenamento");
    }

    res.download(caminho, documento.nomeOriginal);
  }),
);

documentosRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const documento = await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!documento) throw notFound("Documento nao encontrado");

    await prisma.documento.delete({ where: { id: documento.id } });
    fs.rmSync(path.resolve(uploadDir, documento.storageKey), { force: true });

    res.status(204).send();
  }),
);
