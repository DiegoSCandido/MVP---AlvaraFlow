import { describe, expect, it } from "vitest";
import { alvaraSchema } from "./alvaras.schema.js";

/** Payload minimo valido; cada teste sobrescreve so o campo que esta em jogo. */
function payload(overrides: Record<string, unknown> = {}) {
  return {
    clienteId: "cli_1",
    tipo: "Alvara de Funcionamento",
    requestDate: "2026-01-10",
    ...overrides,
  };
}

describe("alvaraSchema", () => {
  it("aplica os defaults de quem nao mandou nada", () => {
    const parsed = alvaraSchema.parse(payload());

    expect(parsed.processingStatus).toBe("lancado");
    expect(parsed.isento).toBe(false);
    expect(parsed.semPontoFixo).toBe(false);
  });

  it("converte data em string ISO para Date", () => {
    const parsed = alvaraSchema.parse(payload({ issueDate: "2026-02-01" }));

    expect(parsed.requestDate).toBeInstanceOf(Date);
    expect(parsed.issueDate?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("recusa tipo de alvara fora da lista, com a mensagem do dominio", () => {
    const resultado = alvaraSchema.safeParse(payload({ tipo: "Alvara de Pesca" }));

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(resultado.error.issues[0]?.message).toBe("Tipo de alvara invalido");
  });

  it("exige o cliente", () => {
    const resultado = alvaraSchema.safeParse(payload({ clienteId: "" }));

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(resultado.error.issues[0]?.message).toBe("Selecione o cliente");
  });

  it("recusa validade anterior a emissao e aponta o campo certo", () => {
    const resultado = alvaraSchema.safeParse(
      payload({ issueDate: "2026-02-01", expirationDate: "2026-01-31" }),
    );

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    const issue = resultado.error.issues[0];
    expect(issue?.path).toEqual(["expirationDate"]);
    expect(issue?.message).toBe("A validade nao pode ser anterior a emissao");
  });

  it("aceita validade no mesmo dia da emissao", () => {
    const resultado = alvaraSchema.safeParse(
      payload({ issueDate: "2026-02-01", expirationDate: "2026-02-01" }),
    );

    expect(resultado.success).toBe(true);
  });

  it("nao compara datas quando uma das duas esta em branco", () => {
    // Processo aberto: so tem validade prevista, emissao ainda nao existe.
    const resultado = alvaraSchema.safeParse(payload({ expirationDate: "2020-01-01" }));

    expect(resultado.success).toBe(true);
  });
});
