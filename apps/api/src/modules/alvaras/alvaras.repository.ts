import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { calcularStatus, diasAteVencimento } from "../../lib/domain.js";
import type { alvaraQuerySchema } from "./alvaras.schema.js";
import type { z } from "zod";

type AlvaraQuery = z.infer<typeof alvaraQuerySchema>;

const include = {
  cliente: { select: { id: true, cnpj: true, razaoSocial: true, nomeFantasia: true, municipio: true, uf: true } },
  documentos: { select: { id: true, nomeOriginal: true, mimeType: true, tamanho: true, createdAt: true } },
} satisfies Prisma.AlvaraInclude;

type AlvaraComRelacoes = Prisma.AlvaraGetPayload<{ include: typeof include }>;

export function serializar(alvara: AlvaraComRelacoes) {
  return {
    ...alvara,
    status: calcularStatus(alvara),
    diasParaVencer: diasAteVencimento(alvara.expirationDate),
  };
}

export async function listar(query: AlvaraQuery) {
  const where: Prisma.AlvaraWhereInput = {};

  if (query.clienteId) where.clienteId = query.clienteId;
  if (query.tipo) where.tipo = query.tipo;
  if (query.processingStatus) where.processingStatus = query.processingStatus;

  if (query.busca) {
    where.OR = [
      { cliente: { razaoSocial: { contains: query.busca } } },
      { cliente: { nomeFantasia: { contains: query.busca } } },
      { cliente: { cnpj: { contains: query.busca.replace(/\D/g, "") || query.busca } } },
      { protocoloPrefeitura: { contains: query.busca } },
    ];
  }

  const alvaras = await prisma.alvara.findMany({ where, include });

  const serializados = alvaras.map(serializar).sort(porUrgencia);

  // status e derivado das datas, entao o filtro roda depois da consulta.
  return query.status ? serializados.filter((a) => a.status === query.status) : serializados;
}

/**
 * Ordena do mais urgente ao menos urgente. Nao da para delegar ao banco:
 * o prazo e derivado na leitura, e um ORDER BY em expirationDate colocaria os
 * nulos (validade indeterminada e processos em aberto) no topo da lista.
 */
function porUrgencia(a: ReturnType<typeof serializar>, b: ReturnType<typeof serializar>) {
  const prazoA = a.diasParaVencer ?? Number.POSITIVE_INFINITY;
  const prazoB = b.diasParaVencer ?? Number.POSITIVE_INFINITY;
  if (prazoA !== prazoB) return prazoA - prazoB;
  // Entre dois sem prazo, o pedido mais recente primeiro.
  return b.requestDate.getTime() - a.requestDate.getTime();
}

export async function buscarPorId(id: string) {
  const alvara = await prisma.alvara.findUnique({ where: { id }, include });
  return alvara ? serializar(alvara) : null;
}

export { include as alvaraInclude };
