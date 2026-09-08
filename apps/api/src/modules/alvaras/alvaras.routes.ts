import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest, notFound } from "../../lib/http-error.js";
import { requireAuth } from "../../middleware/auth.js";
import { TIPOS_ISENTAVEIS } from "../../lib/domain.js";
import * as repo from "./alvaras.repository.js";
import { alvaraQuerySchema, alvaraSchema, alvaraUpdateSchema } from "./alvaras.schema.js";

export const alvarasRoutes = Router();

alvarasRoutes.use(requireAuth);

alvarasRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await repo.listar(alvaraQuerySchema.parse(req.query)));
  }),
);

alvarasRoutes.get(
  "/cliente/:clienteId",
  asyncHandler(async (req, res) => {
    res.json(await repo.listar({ clienteId: req.params.clienteId }));
  }),
);

alvarasRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const alvara = await repo.buscarPorId(req.params.id);
    if (!alvara) throw notFound("Alvara nao encontrado");
    res.json(alvara);
  }),
);

alvarasRoutes.post(
  "/",
  asyncHandler(async (req, res) => {
    const dados = alvaraSchema.parse(req.body);

    if (!(await prisma.cliente.findUnique({ where: { id: dados.clienteId } }))) {
      throw notFound("Cliente informado nao existe");
    }

    if (dados.isento && !TIPOS_ISENTAVEIS.includes(dados.tipo)) {
      throw badRequest(`Isencao nao se aplica a "${dados.tipo}"`);
    }

    const alvara = await prisma.alvara.create({ data: dados, include: repo.alvaraInclude });
    res.status(201).json(repo.serializar(alvara));
  }),
);

alvarasRoutes.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const dados = alvaraUpdateSchema.parse(req.body);

    const atual = await prisma.alvara.findUnique({ where: { id: req.params.id } });
    if (!atual) throw notFound("Alvara nao encontrado");

    const tipo = dados.tipo ?? atual.tipo;
    if ((dados.isento ?? atual.isento) && !TIPOS_ISENTAVEIS.includes(tipo)) {
      throw badRequest(`Isencao nao se aplica a "${tipo}"`);
    }

    const alvara = await prisma.alvara.update({
      where: { id: req.params.id },
      data: dados,
      include: repo.alvaraInclude,
    });

    res.json(repo.serializar(alvara));
  }),
);

/** Atalho da tela de lista: registra emissao/validade e encerra o andamento. */
alvarasRoutes.post(
  "/:id/finalizar",
  asyncHandler(async (req, res) => {
    const { issueDate, expirationDate } = alvaraUpdateSchema
      .pick({ issueDate: true, expirationDate: true })
      .parse(req.body);

    if (!issueDate) throw badRequest("Informe a data de emissao para finalizar o processo");

    const alvara = await prisma.alvara.update({
      where: { id: req.params.id },
      data: { issueDate, expirationDate, processingStatus: "lancado", andamento: "finalizado" },
      include: repo.alvaraInclude,
    });

    res.json(repo.serializar(alvara));
  }),
);

alvarasRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.alvara.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
