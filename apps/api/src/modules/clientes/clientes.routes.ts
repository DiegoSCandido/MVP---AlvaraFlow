import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { prisma } from "../../lib/prisma.js";
import { conflict, notFound } from "../../lib/http-error.js";
import { requireAuth } from "../../middleware/auth.js";
import { formatarCnpj, somenteDigitos } from "../../lib/cnpj.js";
import * as repo from "./clientes.repository.js";
import { clienteQuerySchema, clienteSchema, clienteUpdateSchema } from "./clientes.schema.js";

export const clientesRoutes = Router();

clientesRoutes.use(requireAuth);

clientesRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = clienteQuerySchema.parse(req.query);
    res.json(await repo.listar(query));
  }),
);

clientesRoutes.get(
  "/cnpj/:cnpj",
  asyncHandler(async (req, res) => {
    const cliente = await repo.buscarPorCnpj(somenteDigitos(req.params.cnpj));
    if (!cliente) throw notFound(`Nenhum cliente com o CNPJ ${formatarCnpj(req.params.cnpj)}`);
    res.json(cliente);
  }),
);

clientesRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const cliente = await repo.buscarPorId(req.params.id);
    if (!cliente) throw notFound("Cliente nao encontrado");
    res.json(cliente);
  }),
);

clientesRoutes.post(
  "/",
  asyncHandler(async (req, res) => {
    const { atividadesSecundarias, ...dados } = clienteSchema.parse(req.body);

    if (await prisma.cliente.findUnique({ where: { cnpj: dados.cnpj } })) {
      throw conflict(`Ja existe um cliente com o CNPJ ${formatarCnpj(dados.cnpj)}`);
    }

    const cliente = await prisma.cliente.create({
      data: {
        ...dados,
        // "sem atividade" so faz sentido para cliente ativo.
        semAtividade: dados.ativo ? dados.semAtividade : false,
        atividadesSecundarias: { create: atividadesSecundarias },
      },
      include: repo.clienteInclude,
    });

    res.status(201).json(repo.serializar(cliente));
  }),
);

clientesRoutes.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { atividadesSecundarias, ...dados } = clienteUpdateSchema.parse(req.body);

    const atual = await prisma.cliente.findUnique({ where: { id: req.params.id } });
    if (!atual) throw notFound("Cliente nao encontrado");

    const ativo = dados.ativo ?? atual.ativo;

    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: {
        ...dados,
        semAtividade: ativo ? (dados.semAtividade ?? atual.semAtividade) : false,
        // Lista de CNAEs secundarios e substituida por inteiro quando enviada.
        ...(atividadesSecundarias
          ? { atividadesSecundarias: { deleteMany: {}, create: atividadesSecundarias } }
          : {}),
      },
      include: repo.clienteInclude,
    });

    res.json(repo.serializar(cliente));
  }),
);

clientesRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.cliente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
