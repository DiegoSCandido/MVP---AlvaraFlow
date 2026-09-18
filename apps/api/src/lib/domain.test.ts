import { describe, expect, it } from "vitest";
import { DIAS_ALERTA_VENCIMENTO, calcularStatus, diasAteVencimento } from "./domain.js";

/**
 * "hoje" fixo: sem isso o teste passaria hoje e quebraria em 30 dias.
 * calcularStatus aceita a data como parametro justamente para permitir isso.
 */
const HOJE = new Date("2026-09-18T12:00:00Z");

/** Atalho: data a N dias de HOJE (negativo = passado). */
function emDias(dias: number): Date {
  const d = new Date(HOJE);
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
}

describe("calcularStatus", () => {
  it("retorna pending enquanto o alvara nao foi emitido", () => {
    const status = calcularStatus({ issueDate: null, expirationDate: emDias(60) }, HOJE);
    expect(status).toBe("pending");
  });

  it("retorna pending mesmo quando a validade informada ja passou", () => {
    // Processo em andamento nao vence: sem emissao, nao ha o que expirar.
    const status = calcularStatus({ issueDate: null, expirationDate: emDias(-10) }, HOJE);
    expect(status).toBe("pending");
  });

  it("retorna valid quando o alvara e por prazo indeterminado", () => {
    const status = calcularStatus({ issueDate: emDias(-400), expirationDate: null }, HOJE);
    expect(status).toBe("valid");
  });

  it("retorna expired um dia depois do vencimento", () => {
    const status = calcularStatus({ issueDate: emDias(-365), expirationDate: emDias(-1) }, HOJE);
    expect(status).toBe("expired");
  });

  it("ainda considera expiring no proprio dia do vencimento", () => {
    // Regra de negocio: o alvara vale ate o fim do dia da validade.
    const status = calcularStatus({ issueDate: emDias(-365), expirationDate: emDias(0) }, HOJE);
    expect(status).toBe("expiring");
  });

  it("entra em expiring exatamente no limite da janela de alerta", () => {
    const status = calcularStatus(
      { issueDate: emDias(-300), expirationDate: emDias(DIAS_ALERTA_VENCIMENTO) },
      HOJE,
    );
    expect(status).toBe("expiring");
  });

  it("continua valid um dia antes de entrar na janela de alerta", () => {
    const status = calcularStatus(
      { issueDate: emDias(-300), expirationDate: emDias(DIAS_ALERTA_VENCIMENTO + 1) },
      HOJE,
    );
    expect(status).toBe("valid");
  });

  it("compara dias, nao horas: vencer hoje de manha nao antecipa o expired", () => {
    const status = calcularStatus(
      { issueDate: new Date("2025-09-18T00:00:00Z"), expirationDate: new Date("2026-09-18T00:00:01Z") },
      new Date("2026-09-18T23:59:59Z"),
    );
    expect(status).toBe("expiring");
  });
});

describe("diasAteVencimento", () => {
  it("retorna null quando nao ha validade", () => {
    expect(diasAteVencimento(null, HOJE)).toBeNull();
  });

  it("conta os dias restantes", () => {
    expect(diasAteVencimento(emDias(45), HOJE)).toBe(45);
  });

  it("retorna zero no dia do vencimento", () => {
    expect(diasAteVencimento(emDias(0), HOJE)).toBe(0);
  });

  it("retorna negativo para alvara ja vencido", () => {
    expect(diasAteVencimento(emDias(-7), HOJE)).toBe(-7);
  });
});
