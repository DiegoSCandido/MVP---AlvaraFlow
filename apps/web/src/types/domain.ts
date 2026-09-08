/** Espelho do vocabulario de dominio da API (apps/api/src/lib/domain.ts). */

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

export const TIPOS_ISENTAVEIS: readonly string[] = [
  "Alvara de Funcionamento",
  "Alvara Sanitario",
  "Alvara dos Bombeiros",
];

export type AlvaraStatus = "pending" | "valid" | "expiring" | "expired";
export type ProcessingStatus = "lancado" | "aguardando_cliente" | "aguardando_orgao" | "renovacao";
export type Andamento =
  | "protocolado"
  | "aguardando_cliente"
  | "aguardando_orgao"
  | "aguardando_pagamento"
  | "finalizado";

export interface Usuario {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
  ativo: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface AtividadeSecundaria {
  id: string;
  codigo: string;
  descricao: string;
}

export interface ClienteResumo {
  total: number;
  vencidos: number;
  vencendo: number;
  pendentes: number;
}

export interface Cliente {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  uf: string;
  municipio: string;
  atividadePrincipalCodigo: string;
  atividadePrincipalDescricao: string;
  ativo: boolean;
  semAtividade: boolean;
  isNovo: boolean;
  createdAt: string;
  updatedAt: string;
  atividadesSecundarias: AtividadeSecundaria[];
  alvaras: Alvara[];
  resumo: ClienteResumo;
}

export interface ClienteRef {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  municipio?: string;
  uf?: string;
}

export interface Alvara {
  id: string;
  clienteId: string;
  tipo: AlvaraTipo;
  requestDate: string;
  issueDate: string | null;
  expirationDate: string | null;
  processingStatus: ProcessingStatus;
  andamento: Andamento | null;
  isento: boolean;
  semPontoFixo: boolean;
  protocoloPrefeitura: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Derivados pela API — nao existem no banco. */
  status: AlvaraStatus;
  diasParaVencer: number | null;
  cliente?: ClienteRef;
}

export type TaxaSituacao = "paga" | "enviada" | "gerada" | "nao_iniciada";

export interface Taxa {
  id: string;
  clienteId: string;
  ano: number;
  gerada: boolean;
  enviada: boolean;
  paga: boolean;
  protocolo: string;
  valor: number | null;
  dataEnvio: string | null;
  dataPagamento: string | null;
}

export interface LinhaTaxa {
  clienteId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  municipio: string;
  uf: string;
  ano: number;
  taxa: Taxa | null;
  situacao: TaxaSituacao;
  alvaraFuncionamento: {
    id: string;
    status: AlvaraStatus;
    processingStatus: ProcessingStatus;
    emAberto: boolean;
  } | null;
}

export interface TaxasResponse {
  ano: number;
  resumo: {
    clientes: number;
    pagas: number;
    aguardandoPagamento: number;
    aguardandoEnvio: number;
    naoIniciadas: number;
  };
  linhas: LinhaTaxa[];
}

export interface DashboardResponse {
  clientes: { ativos: number; inativos: number };
  alvaras: {
    total: number;
    validos: number;
    vencendo: number;
    vencidos: number;
    pendentes: number;
  };
  porTipo: Record<string, number>;
  proximosVencimentos: Array<{
    id: string;
    tipo: string;
    status: AlvaraStatus;
    expirationDate: string | null;
    diasParaVencer: number | null;
    cliente: ClienteRef;
  }>;
}
