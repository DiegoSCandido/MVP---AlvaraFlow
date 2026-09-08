import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  titulo: string;
  valor: number | string;
  descricao?: string;
  icone: LucideIcon;
  /** Cor do icone; usa as cores semanticas de status quando informada. */
  tom?: "primary" | "valid" | "expiring" | "expired" | "pending";
  ativo?: boolean;
  onClick?: () => void;
}

const TONS: Record<NonNullable<StatCardProps["tom"]>, string> = {
  primary: "bg-primary/10 text-primary",
  valid: "bg-status-valid/12 text-status-valid",
  expiring: "bg-status-expiring/12 text-status-expiring",
  expired: "bg-status-expired/12 text-status-expired",
  pending: "bg-status-pending/12 text-status-pending",
};

export function StatCard({
  titulo,
  valor,
  descricao,
  icone: Icone,
  tom = "primary",
  ativo = false,
  onClick,
}: StatCardProps) {
  const clicavel = Boolean(onClick);

  return (
    <Card
      // Vira botao apenas quando filtra a lista abaixo; caso contrario e so leitura.
      {...(clicavel
        ? { role: "button" as const, tabIndex: 0, onClick, onKeyDown: teclado(onClick!) }
        : {})}
      className={cn(
        "transition-colors",
        clicavel && "cursor-pointer hover:border-primary/40",
        ativo && "border-primary ring-1 ring-primary/30",
      )}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", TONS[tom])}>
          <Icone className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{titulo}</p>
          <p className="text-2xl font-semibold tabular-nums leading-tight">{valor}</p>
          {descricao ? (
            <p className="truncate text-xs text-muted-foreground">{descricao}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function teclado(acao: () => void) {
  return (evento: React.KeyboardEvent) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      acao();
    }
  };
}
