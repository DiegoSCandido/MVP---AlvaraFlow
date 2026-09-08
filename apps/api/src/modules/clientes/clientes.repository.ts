import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { calcularStatus } from "../../lib/domain.js";
import type { clienteQuerySchema } from "./clientes.schema.js";
import type { z } from "zod";

type ClienteQuery = z.infer<typeof clienteQuerySchema>;

const include = {
  atividadesSecundarias: { orderBy: { codigo: "asc" } },
  alvaras: { orderBy: { requestDate: "desc" } },
} satisfies Prisma.ClienteInclude;

/**
 * A "situacao" combina tres flags que sao independentes no banco:
 * inativos = ativo:false; sem_atividade e novos so existem dentro dos ativos.
 */
function whereDaSituacao(situacao: ClienteQuery["situacao"]): Prisma.ClienteWhereInput {
  switch (situacao) {
    case "inativos":
      return { ativo: false };
    case "sem_atividade":
      return { ativo: true, semAtividade: true };
    case "novos":
      return { ativo: true, isNovo: true };
    case "todos":
      return {};
    default:
      return { ativo: true, semAtividade: false };
  }
}

export async function listar(query: ClienteQuery) {
  const where: Prisma.ClienteWhereInput = { ...whereDaSituacao(query.situacao) };

  if (query.uf) where.uf = query.uf.toUpperCase();

  if (query.busca) {
    const busca = query.busca;
    where.OR = [
      { razaoSocial: { contains: busca } },
      { nomeFantasia: { contains: busca } },
      { cnpj: { contains: busca.replace(/\D/g, "") || busca } },
      { municipio: { contains: busca } },
    ];
  }

  const clientes = await prisma.cliente.findMany({
    where,
    include,
    orderBy: { razaoSocial: "asc" },
  });

  return clientes.map(serializar);
}

export async function buscarPorId(id: string) {
  const cliente = await prisma.cliente.findUnique({ where: { id }, include });
  return cliente ? serializar(cliente) : null;
}

export async function buscarPorCnpj(cnpj: string) {
  const cliente = await prisma.cliente.findUnique({ where: { cnpj }, include });
  return cliente ? serializar(cliente) : null;
}

type ClienteComRelacoes = Prisma.ClienteGetPayload<{ include: typeof include }>;

/** Acrescenta o status calculado de cada alvara e um resumo usado nas listagens. */
export function serializar(cliente: ClienteComRelacoes) {
  const alvaras = cliente.alvaras.map((alvara) => ({
    ...alvara,
    status: calcularStatus(alvara),
  }));

  return {
    ...cliente,
    alvaras,
    resumo: {
      total: alvaras.length,
      vencidos: alvaras.filter((a) => a.status === "expired").length,
      vencendo: alvaras.filter((a) => a.status === "expiring").length,
      pendentes: alvaras.filter((a) => a.status === "pending").length,
    },
  };
}

export { include as clienteInclude };
