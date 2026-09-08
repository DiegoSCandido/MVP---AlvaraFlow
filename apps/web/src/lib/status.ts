import type { AlvaraStatus, Andamento, ProcessingStatus, TaxaSituacao } from "@/types/domain";

interface Config {
  label: string;
  /** Classes do badge, escritas nas duas variantes de tema. */
  className: string;
}

export const STATUS_CONFIG: Record<AlvaraStatus, Config> = {
  valid: { label: "Ativo", className: "bg-status-valid/12 text-status-valid border-status-valid/30" },
  expiring: {
    label: "Vencendo",
    className: "bg-status-expiring/12 text-status-expiring border-status-expiring/30",
  },
  expired: {
    label: "Vencido",
    className: "bg-status-expired/12 text-status-expired border-status-expired/30",
  },
  pending: {
    label: "Em processo",
    className: "bg-status-pending/12 text-status-pending border-status-pending/30",
  },
};

export const PROCESSING_STATUS_CONFIG: Record<ProcessingStatus, Config> = {
  lancado: { label: "Lancado", className: "bg-muted text-muted-foreground border-border" },
  aguardando_cliente: {
    label: "Aguardando cliente",
    className: "bg-amber-500/12 text-amber-600 border-amber-500/30 dark:text-amber-400",
  },
  aguardando_orgao: {
    label: "Aguardando orgao",
    className: "bg-sky-500/12 text-sky-600 border-sky-500/30 dark:text-sky-400",
  },
  renovacao: {
    label: "Renovacao",
    className: "bg-violet-500/12 text-violet-600 border-violet-500/30 dark:text-violet-400",
  },
};

export const ANDAMENTO_CONFIG: Record<Andamento, Config> = {
  protocolado: {
    label: "Protocolado",
    className: "bg-violet-500/12 text-violet-600 border-violet-500/30 dark:text-violet-400",
  },
  aguardando_cliente: {
    label: "Aguardando cliente",
    className: "bg-amber-500/12 text-amber-600 border-amber-500/30 dark:text-amber-400",
  },
  aguardando_orgao: {
    label: "Aguardando orgao",
    className: "bg-sky-500/12 text-sky-600 border-sky-500/30 dark:text-sky-400",
  },
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    className: "bg-orange-500/12 text-orange-600 border-orange-500/30 dark:text-orange-400",
  },
  finalizado: {
    label: "Finalizado",
    className: "bg-status-valid/12 text-status-valid border-status-valid/30",
  },
};

export const TAXA_SITUACAO_CONFIG: Record<TaxaSituacao, Config> = {
  paga: { label: "Paga", className: "bg-status-valid/12 text-status-valid border-status-valid/30" },
  enviada: {
    label: "Aguardando pagamento",
    className: "bg-status-expiring/12 text-status-expiring border-status-expiring/30",
  },
  gerada: {
    label: "Aguardando envio",
    className: "bg-violet-500/12 text-violet-600 border-violet-500/30 dark:text-violet-400",
  },
  nao_iniciada: { label: "Nao iniciada", className: "bg-muted text-muted-foreground border-border" },
};

/**
 * Situacao derivada dos tres booleanos da taxa, do estagio mais avancado ao
 * inicial. Mesma regra aplicada na API — mantida aqui para atualizacao otimista.
 */
export function situacaoDaTaxa(
  taxa?: { gerada: boolean; enviada: boolean; paga: boolean } | null,
): TaxaSituacao {
  if (!taxa) return "nao_iniciada";
  if (taxa.paga) return "paga";
  if (taxa.enviada) return "enviada";
  if (taxa.gerada) return "gerada";
  return "nao_iniciada";
}
