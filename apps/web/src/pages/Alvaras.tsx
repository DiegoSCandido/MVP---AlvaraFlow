import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CircleCheck, Clock, FileCheck2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { AlvaraFormDialog } from "@/components/AlvaraFormDialog";
import { AndamentoBadge, ProcessingStatusBadge, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatarCnpj, formatarData, textoPrazo } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";
import { ALVARA_TIPOS } from "@/types/domain";
import type { Alvara, AlvaraStatus } from "@/types/domain";

const TODOS = "todos";

export default function Alvaras() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const [tipo, setTipo] = useState<string>(TODOS);
  const [status, setStatus] = useState<string>(TODOS);
  const buscaAdiada = useDebounce(busca, 300);

  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Alvara | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Alvara | null>(null);

  // Mantem ?busca= na URL para que o link do dashboard continue valido ao recarregar.
  useEffect(() => {
    setSearchParams(buscaAdiada ? { busca: buscaAdiada } : {}, { replace: true });
  }, [buscaAdiada, setSearchParams]);

  const { data: alvaras, isLoading } = useQuery({
    queryKey: ["alvaras", buscaAdiada, tipo, status],
    queryFn: () =>
      api.alvaras.list({
        busca: buscaAdiada || undefined,
        tipo: tipo === TODOS ? undefined : tipo,
        status: status === TODOS ? undefined : status,
      }),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => api.alvaras.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alvaras"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Alvara excluido");
      setParaExcluir(null);
    },
    onError: (erro) => toast.error(erro instanceof Error ? erro.message : "Falha ao excluir"),
  });

  const contagem = (alvo: AlvaraStatus) => alvaras?.filter((a) => a.status === alvo).length ?? 0;

  function alternarStatus(alvo: AlvaraStatus) {
    setStatus((atual) => (atual === alvo ? TODOS : alvo));
  }

  function abrirNovo() {
    setEmEdicao(null);
    setDialogoAberto(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Alvaras"
        descricao="Todos os processos de licenciamento e sua vigencia."
        acoes={
          <Button onClick={abrirNovo}>
            <Plus className="size-4" />
            Novo alvara
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Vigentes"
          valor={contagem("valid")}
          icone={CircleCheck}
          tom="valid"
          ativo={status === "valid"}
          onClick={() => alternarStatus("valid")}
        />
        <StatCard
          titulo="Vencendo"
          valor={contagem("expiring")}
          icone={AlertTriangle}
          tom="expiring"
          ativo={status === "expiring"}
          onClick={() => alternarStatus("expiring")}
        />
        <StatCard
          titulo="Vencidos"
          valor={contagem("expired")}
          icone={AlertTriangle}
          tom="expired"
          ativo={status === "expired"}
          onClick={() => alternarStatus("expired")}
        />
        <StatCard
          titulo="Em processo"
          valor={contagem("pending")}
          icone={Clock}
          tom="pending"
          ativo={status === "pending"}
          onClick={() => alternarStatus("pending")}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cliente, CNPJ ou protocolo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os tipos</SelectItem>
            {ALVARA_TIPOS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !alvaras?.length ? (
            <EmptyState
              icone={FileCheck2}
              titulo="Nenhum alvara encontrado"
              descricao="Ajuste os filtros ou cadastre um novo processo."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Andamento</TableHead>
                    <TableHead className="w-24 text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alvaras.map((alvara) => (
                    <TableRow key={alvara.id}>
                      <TableCell>
                        <p className="font-medium">{alvara.cliente?.razaoSocial}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {formatarCnpj(alvara.cliente?.cnpj)}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {alvara.tipo}
                        {alvara.isento ? (
                          <span className="ml-2 rounded border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                            isento
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {formatarData(alvara.expirationDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {textoPrazo(alvara.diasParaVencer)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={alvara.status} />
                      </TableCell>
                      <TableCell>
                        <ProcessingStatusBadge status={alvara.processingStatus} />
                      </TableCell>
                      <TableCell>
                        <AndamentoBadge andamento={alvara.andamento} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar alvara"
                            onClick={() => {
                              setEmEdicao(alvara);
                              setDialogoAberto(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir alvara"
                            onClick={() => setParaExcluir(alvara)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlvaraFormDialog aberto={dialogoAberto} onOpenChange={setDialogoAberto} alvara={emEdicao} />

      <AlertDialog
        open={Boolean(paraExcluir)}
        onOpenChange={(aberto) => !aberto && setParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir alvara</AlertDialogTitle>
            <AlertDialogDescription>
              {paraExcluir?.tipo} de {paraExcluir?.cliente?.razaoSocial} sera removido junto com os
              anexos. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => paraExcluir && excluir.mutate(paraExcluir.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
