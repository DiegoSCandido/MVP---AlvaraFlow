/**
 * Vocabulario de dominio compartilhado pela API.
 * O frontend espelha estes valores em src/types — mantenha os dois lados juntos.
 */

export const ALVARA_TIPOS = [
  "Alvara de Funcionamento",
  "Alvara dos Bombeiros",
  "Alvara Sanitario",
  "Licenciamento Ambiental",
  "Laudo Acustico",
  "Alvara da Policia Civil",
  "Dispensa de Alvara Sanitario",
] as const;
export type AlvaraTipo = (typeof ALVARA_TIPOS)[number];

/** Tipos que podem ser marcados como isentos de taxa. */
export const TIPOS_ISENTAVEIS: readonly string[] = [
  "Alvara de Funcionamento",
  "Alvara Sanitario",
  "Alvara dos Bombeiros",
];

export const PROCESSING_STATUS = [
  "lancado",
  "aguardando_cliente",
  "aguardando_orgao",
  "renovacao",
] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUS)[number];

export const ANDAMENTOS = [
  "protocolado",
  "aguardando_cliente",
  "aguardando_orgao",
  "aguardando_pagamento",
  "finalizado",
] as const;
export type Andamento = (typeof ANDAMENTOS)[number];

/** Vigencia derivada das datas — nunca gravada, sempre calculada. */
export const ALVARA_STATUS = ["pending", "valid", "expiring", "expired"] as const;
export type AlvaraStatus = (typeof ALVARA_STATUS)[number];

/** Janela (em dias) em que um alvara passa a contar como "vencendo". */
export const DIAS_ALERTA_VENCIMENTO = 30;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Meia-noite UTC da data, para comparar dias sem interferencia de fuso. */
function diaUTC(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

/**
 * Vigencia do alvara:
 * - sem data de emissao  -> pending (processo ainda em andamento);
 * - sem data de validade -> valid (alvara por prazo indeterminado);
 * - vencido              -> expired;
 * - vence em ate 30 dias -> expiring.
 */
export function calcularStatus(
  alvara: { issueDate: Date | null; expirationDate: Date | null },
  hoje = new Date(),
): AlvaraStatus {
  if (!alvara.issueDate) return "pending";
  if (!alvara.expirationDate) return "valid";

  const dias = Math.floor((diaUTC(alvara.expirationDate) - diaUTC(hoje)) / MS_POR_DIA);
  if (dias < 0) return "expired";
  if (dias <= DIAS_ALERTA_VENCIMENTO) return "expiring";
  return "valid";
}

/** Dias restantes ate o vencimento (negativo quando ja venceu). */
export function diasAteVencimento(expirationDate: Date | null, hoje = new Date()): number | null {
  if (!expirationDate) return null;
  return Math.floor((diaUTC(expirationDate) - diaUTC(hoje)) / MS_POR_DIA);
}
