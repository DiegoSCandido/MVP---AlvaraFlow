import { z } from "zod";

const ANO_MIN = 2000;
const ANO_MAX = 2100;

export const taxaSchema = z.object({
  clienteId: z.string().min(1, "Selecione o cliente"),
  ano: z.coerce.number().int().min(ANO_MIN).max(ANO_MAX),
  gerada: z.boolean().default(false),
  enviada: z.boolean().default(false),
  paga: z.boolean().default(false),
  protocolo: z.string().default(""),
  valor: z.coerce.number().nonnegative().nullish(),
  dataEnvio: z.coerce.date().nullish(),
  dataPagamento: z.coerce.date().nullish(),
});

export const taxaUpdateSchema = taxaSchema.partial().omit({ clienteId: true, ano: true });

export const taxaQuerySchema = z.object({
  ano: z.coerce.number().int().min(ANO_MIN).max(ANO_MAX).default(new Date().getFullYear()),
  situacao: z.enum(["todas", "paga", "enviada", "gerada", "nao_iniciada"]).default("todas"),
});
