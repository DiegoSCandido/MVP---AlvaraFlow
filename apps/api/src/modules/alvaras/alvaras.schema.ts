import { z } from "zod";
import { ALVARA_TIPOS, ANDAMENTOS, PROCESSING_STATUS } from "../../lib/domain.js";

/** Aceita ISO string ou Date e normaliza para Date. */
const dataOpcional = z.coerce.date().nullish();

export const alvaraSchema = z
  .object({
    clienteId: z.string().min(1, "Selecione o cliente"),
    tipo: z.enum(ALVARA_TIPOS, { errorMap: () => ({ message: "Tipo de alvara invalido" }) }),
    requestDate: z.coerce.date({ required_error: "Informe a data de solicitacao" }),
    issueDate: dataOpcional,
    expirationDate: dataOpcional,
    processingStatus: z.enum(PROCESSING_STATUS).default("lancado"),
    andamento: z.enum(ANDAMENTOS).nullish(),
    isento: z.boolean().default(false),
    semPontoFixo: z.boolean().default(false),
    protocoloPrefeitura: z.string().nullish(),
    notes: z.string().nullish(),
  })
  .refine(
    (data) => !data.issueDate || !data.expirationDate || data.expirationDate >= data.issueDate,
    { path: ["expirationDate"], message: "A validade nao pode ser anterior a emissao" },
  );

export const alvaraUpdateSchema = alvaraSchema.innerType().partial().omit({ clienteId: true });

export const alvaraQuerySchema = z.object({
  clienteId: z.string().optional(),
  tipo: z.string().optional(),
  status: z.enum(["pending", "valid", "expiring", "expired"]).optional(),
  processingStatus: z.enum(PROCESSING_STATUS).optional(),
  busca: z.string().trim().optional(),
});

export type AlvaraInput = z.infer<typeof alvaraSchema>;
