import { describe, expect, it } from "vitest";
import { cnpjValido, formatarCnpj, somenteDigitos } from "./cnpj.js";

/**
 * CNPJs sinteticos: os digitos verificadores foram calculados para o teste passar,
 * as empresas nao existem.
 */
const CNPJ_VALIDO = "11222333000181";
const CNPJ_VALIDO_FORMATADO = "11.222.333/0001-81";

describe("somenteDigitos", () => {
  it("remove mascara, espacos e qualquer pontuacao", () => {
    expect(somenteDigitos(" 11.222.333/0001-81 ")).toBe(CNPJ_VALIDO);
  });

  it("devolve string vazia quando nao ha digito nenhum", () => {
    expect(somenteDigitos("sem numero")).toBe("");
  });
});

describe("formatarCnpj", () => {
  it("aplica a mascara em um CNPJ limpo", () => {
    expect(formatarCnpj(CNPJ_VALIDO)).toBe(CNPJ_VALIDO_FORMATADO);
  });

  it("e idempotente: formatar de novo nao quebra a mascara", () => {
    expect(formatarCnpj(CNPJ_VALIDO_FORMATADO)).toBe(CNPJ_VALIDO_FORMATADO);
  });

  it("devolve a entrada intacta quando nao tem 14 digitos", () => {
    // Contrato atual: formatar nao valida, so mascara o que tem tamanho certo.
    expect(formatarCnpj("123")).toBe("123");
  });
});

describe("cnpjValido", () => {
  it("aceita um CNPJ com digitos verificadores corretos", () => {
    expect(cnpjValido(CNPJ_VALIDO)).toBe(true);
  });

  it("aceita o mesmo CNPJ com mascara", () => {
    expect(cnpjValido(CNPJ_VALIDO_FORMATADO)).toBe(true);
  });

  it("aceita CNPJ que comeca com zeros", () => {
    // Regressao: tratar o CNPJ como numero comeria os zeros a esquerda.
    expect(cnpjValido("00000001000136")).toBe(true);
  });

  it("rejeita quando o primeiro digito verificador esta errado", () => {
    expect(cnpjValido("11222333000191")).toBe(false);
  });

  it("rejeita quando o segundo digito verificador esta errado", () => {
    expect(cnpjValido("11222333000182")).toBe(false);
  });

  it.each(["00000000000000", "11111111111111", "99999999999999"])(
    "rejeita a sequencia repetida %s",
    (sequencia) => {
      expect(cnpjValido(sequencia)).toBe(false);
    },
  );

  it.each([
    ["curto demais", "1122233300018"],
    ["longo demais", "112223330001811"],
    ["vazio", ""],
    ["so letras", "abcdefghijklmn"],
  ])("rejeita entrada %s", (_caso, entrada) => {
    expect(cnpjValido(entrada)).toBe(false);
  });
});
