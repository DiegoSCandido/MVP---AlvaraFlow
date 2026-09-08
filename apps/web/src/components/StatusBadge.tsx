import { cn } from "@/lib/utils";
import {
  ANDAMENTO_CONFIG,
  PROCESSING_STATUS_CONFIG,
  STATUS_CONFIG,
  TAXA_SITUACAO_CONFIG,
} from "@/lib/status";
import type { AlvaraStatus, Andamento, ProcessingStatus, TaxaSituacao } from "@/types/domain";

const base =
  "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium";

export function StatusBadge({ status, className }: { status: AlvaraStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  return <span className={cn(base, config.className, className)}>{config.label}</span>;
}

export function ProcessingStatusBadge({ status }: { status: ProcessingStatus }) {
  const config = PROCESSING_STATUS_CONFIG[status];
  return <span className={cn(base, config.className)}>{config.label}</span>;
}

export function AndamentoBadge({ andamento }: { andamento: Andamento | null }) {
  if (!andamento) return <span className="text-muted-foreground">—</span>;
  const config = ANDAMENTO_CONFIG[andamento];
  return <span className={cn(base, config.className)}>{config.label}</span>;
}

export function TaxaSituacaoBadge({ situacao }: { situacao: TaxaSituacao }) {
  const config = TAXA_SITUACAO_CONFIG[situacao];
  return <span className={cn(base, config.className)}>{config.label}</span>;
}
