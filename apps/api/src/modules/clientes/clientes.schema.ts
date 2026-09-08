import { z } from "zod";
import { cnpjValido, somenteDigitos } from "../../lib/cnpj.js";

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE",
  "PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
] as const;

export const clienteSchema = z.object({
  cnpj: z
    .string()
    .transform(somenteDigitos)
    .refine(cnpjValido, "CNPJ invalido"),
  razaoSocial: z.string().min(3, "Informe a razao social"),
  nomeFantasia: z.string().default(""),
  uf: z.enum(UFS, { errorMap: () => ({ message: "UF invalida" }) }),
  municipio: z.string().min(2, "Informe o municipio"),
  atividadePrincipalCodigo: z.string().default(""),
  atividadePrincipalDescricao: z.string().default(""),
  ativo: z.boolean().default(true),
  semAtividade: z.boolean().default(false),
  isNovo: z.boolean().default(false),
  atividadesSecundarias: z
    .array(z.object({ codigo: z.string().min(1), descricao: z.string().min(1) }))
    .default([]),
});

export const clienteUpdateSchema = clienteSchema.partial();

/** Filtros aceitos em GET /clientes. */
export const clienteQuerySchema = z.object({
  busca: z.string().trim().optional(),
  uf: z.string().length(2).optional(),
  situacao: z.enum(["ativos", "inativos", "sem_atividade", "novos", "todos"]).default("ativos"),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
