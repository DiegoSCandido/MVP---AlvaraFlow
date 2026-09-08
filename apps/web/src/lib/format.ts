/** Formatacao usada nas tabelas e cards. */

export function formatarCnpj(cnpj?: string | null): string {
  if (!cnpj) return "—";
  const digitos = cnpj.replace(/\D/g, "");
  if (digitos.length !== 14) return cnpj;
  return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function mascararCnpj(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/**
 * Exibe a data em dd/MM/yyyy usando os componentes UTC.
 * As datas trafegam em ISO a meia-noite UTC; converter para o fuso local
 * deslocaria o dia em qualquer fuso negativo (o caso do Brasil).
 */
export function formatarData(valor?: string | Date | null): string {
  if (!valor) return "—";
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";

  const dia = String(data.getUTCDate()).padStart(2, "0");
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${data.getUTCFullYear()}`;
}

/** Converte a data de um <input type="date"> para ISO sem deslocar o dia. */
export function inputDateParaIso(valor: string): string | null {
  return valor ? new Date(`${valor}T00:00:00.000Z`).toISOString() : null;
}

/** Converte ISO para o formato aceito por <input type="date">. */
export function isoParaInputDate(valor?: string | null): string {
  return valor ? valor.slice(0, 10) : "";
}

export function formatarMoeda(valor?: number | null): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Texto da coluna "Prazo": dias restantes ou dias em atraso. */
export function textoPrazo(dias: number | null): string {
  if (dias === null) return "—";
  if (dias < 0) return `${Math.abs(dias)} dias vencido`;
  if (dias === 0) return "Vence hoje";
  return `${dias} dias`;
}
