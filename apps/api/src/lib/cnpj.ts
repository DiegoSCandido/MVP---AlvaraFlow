/** Utilitarios de CNPJ: normalizacao, formatacao e validacao dos digitos verificadores. */

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarCnpj(cnpj: string): string {
  const d = somenteDigitos(cnpj);
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function digitoVerificador(base: string, pesoInicial: number): number {
  let peso = pesoInicial;
  let soma = 0;

  for (const char of base) {
    soma += Number(char) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** Valida os dois digitos verificadores. Rejeita sequencias repetidas (00000000000000). */
export function cnpjValido(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const dv1 = digitoVerificador(d.slice(0, 12), 5);
  const dv2 = digitoVerificador(d.slice(0, 13), 6);

  return dv1 === Number(d[12]) && dv2 === Number(d[13]);
}
