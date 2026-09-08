import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/http-error.js";
import { requireAuth } from "../../middleware/auth.js";
import { calcularStatus } from "../../lib/domain.js";
import { taxaQuerySchema, taxaSchema, taxaUpdateSchema } from "./taxas.schema.js";

export const taxasRoutes = Router();

taxasRoutes.use(requireAuth);

type Situacao = "paga" | "enviada" | "gerada" | "nao_iniciada";

/** Situacao derivada dos tres booleanos, do estagio mais avancado ao inicial. */
function situacaoDaTaxa(taxa: { gerada: boolean; enviada: boolean; paga: boolean } | null): Situacao {
  if (!taxa) return "nao_iniciada";
  if (taxa.paga) return "paga";
  if (taxa.enviada) return "enviada";
  if (taxa.gerada) return "gerada";
  return "nao_iniciada";
}

/**
 * A tela de taxas e orientada a cliente, nao a taxa: lista todo cliente ativo
 * do ano e anexa a taxa quando ela existe (senao, "nao iniciada").
 */
taxasRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const { ano, situacao } = taxaQuerySchema.parse(req.query);

    const clientes = await prisma.cliente.findMany({
      where: { ativo: true, semAtividade: false },
      orderBy: { razaoSocial: "asc" },
      include: {
        taxas: { where: { ano } },
        alvaras: { where: { tipo: "Alvara de Funcionamento" }, orderBy: { requestDate: "desc" }, take: 1 },
      },
    });

    const linhas = clientes.map((cliente) => {
      const taxa = cliente.taxas[0] ?? null;
      const alvara = cliente.alvaras[0] ?? null;

      return {
        clienteId: cliente.id,
        cnpj: cliente.cnpj,
        razaoSocial: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia,
        municipio: cliente.municipio,
        uf: cliente.uf,
        ano,
        taxa,
        situacao: situacaoDaTaxa(taxa),
        alvaraFuncionamento: alvara
          ? {
              id: alvara.id,
              status: calcularStatus(alvara),
              processingStatus: alvara.processingStatus,
              // Em renovacao ha processo novo em curso mesmo com alvara ja emitido.
              emAberto: !alvara.issueDate || alvara.processingStatus === "renovacao",
            }
          : null,
      };
    });

    const filtradas = situacao === "todas" ? linhas : linhas.filter((l) => l.situacao === situacao);

    res.json({
      ano,
      resumo: {
        clientes: linhas.length,
        pagas: linhas.filter((l) => l.situacao === "paga").length,
        aguardandoPagamento: linhas.filter((l) => l.situacao === "enviada").length,
        aguardandoEnvio: linhas.filter((l) => l.situacao === "gerada").length,
        naoIniciadas: linhas.filter((l) => l.situacao === "nao_iniciada").length,
      },
      linhas: filtradas,
    });
  }),
);

/** Cria ou atualiza a taxa do par (cliente, ano) — a tela alterna checkboxes. */
taxasRoutes.put(
  "/",
  asyncHandler(async (req, res) => {
    const { clienteId, ano, ...dados } = taxaSchema.parse(req.body);

    if (!(await prisma.cliente.findUnique({ where: { id: clienteId } }))) {
      throw notFound("Cliente informado nao existe");
    }

    const taxa = await prisma.taxaFuncionamento.upsert({
      where: { clienteId_ano: { clienteId, ano } },
      create: { clienteId, ano, ...dados },
      update: dados,
    });

    res.json({ ...taxa, situacao: situacaoDaTaxa(taxa) });
  }),
);

taxasRoutes.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const dados = taxaUpdateSchema.parse(req.body);
    const taxa = await prisma.taxaFuncionamento.update({ where: { id: req.params.id }, data: dados });
    res.json({ ...taxa, situacao: situacaoDaTaxa(taxa) });
  }),
);

taxasRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.taxaFuncionamento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
