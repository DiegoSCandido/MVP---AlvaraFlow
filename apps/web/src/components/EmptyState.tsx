import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icone: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}

export function EmptyState({ icone: Icone, titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icone className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{titulo}</p>
        {descricao ? <p className="text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {acao}
    </div>
  );
}
