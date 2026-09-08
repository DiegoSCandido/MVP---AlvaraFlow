import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ClienteFormDialog } from "@/components/ClienteFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { formatarCnpj } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";
import type { Cliente } from "@/types/domain";

const ABAS = [
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "novos", rotulo: "Novos" },
  { valor: "sem_atividade", rotulo: "Sem atividade" },
  { valor: "inativos", rotulo: "Inativos" },
  { valor: "todos", rotulo: "Todos" },
] as const;

export default function Clientes() {
  const queryClient = useQueryClient();
  const [situacao, setSituacao] = useState<string>("ativos");
  const [busca, setBusca] = useState("");
  const buscaAdiada = useDebounce(busca, 300);

  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Cliente | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Cliente | null>(null);

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["clientes", situacao, buscaAdiada],
    queryFn: () => api.clientes.list({ situacao, busca: buscaAdiada || undefined }),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => api.clientes.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Cliente excluido");
      setParaExcluir(null);
    },
    onError: (erro) => toast.error(erro instanceof Error ? erro.message : "Falha ao excluir"),
  });

  function abrirNovo() {
    setEmEdicao(null);
    setDialogoAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setEmEdicao(cliente);
    setDialogoAberto(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Clientes"
        descricao="Empresas acompanhadas e a situacao dos alvaras de cada uma."
        acoes={
          <Button onClick={abrirNovo}>
            <Plus className="size-4" />
            Novo cliente
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={situacao} onValueChange={setSituacao}>
          <TabsList>
            {ABAS.map((aba) => (
              <TabsTrigger key={aba.valor} value={aba.valor}>
                {aba.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Razao social, CNPJ ou municipio"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !clientes?.length ? (
            <EmptyState
              icone={Building2}
              titulo="Nenhum cliente encontrado"
              descricao={busca ? "Ajuste a busca ou troque de aba." : "Cadastre o primeiro cliente."}
              acao={
                busca ? null : (
                  <Button onClick={abrirNovo}>
                    <Plus className="size-4" />
                    Novo cliente
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Municipio</TableHead>
                    <TableHead className="text-center">Alvaras</TableHead>
                    <TableHead className="text-center">Pendencias</TableHead>
                    <TableHead className="w-24 text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <p className="font-medium">{cliente.razaoSocial}</p>
                        {cliente.nomeFantasia ? (
                          <p className="text-xs text-muted-foreground">{cliente.nomeFantasia}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatarCnpj(cliente.cnpj)}</TableCell>
                      <TableCell>
                        {cliente.municipio}/{cliente.uf}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {cliente.resumo.total}
                      </TableCell>
                      <TableCell className="text-center">
                        <Pendencias resumo={cliente.resumo} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${cliente.razaoSocial}`}
                            onClick={() => abrirEdicao(cliente)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Excluir ${cliente.razaoSocial}`}
                            onClick={() => setParaExcluir(cliente)}
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

      <ClienteFormDialog
        aberto={dialogoAberto}
        onOpenChange={setDialogoAberto}
        cliente={emEdicao}
      />

      <AlertDialog open={Boolean(paraExcluir)} onOpenChange={(aberto) => !aberto && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              {paraExcluir?.razaoSocial} e todos os alvaras, taxas e anexos vinculados serao
              removidos. Esta acao nao pode ser desfeita.
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

function Pendencias({ resumo }: { resumo: Cliente["resumo"] }) {
  if (resumo.vencidos === 0 && resumo.vencendo === 0 && resumo.pendentes === 0) {
    return <span className="text-sm text-muted-foreground">Em dia</span>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-1.5 text-xs">
      {resumo.vencidos > 0 ? (
        <span className="rounded-full border border-status-expired/30 bg-status-expired/12 px-2 py-0.5 text-status-expired">
          {resumo.vencidos} vencido{resumo.vencidos > 1 ? "s" : ""}
        </span>
      ) : null}
      {resumo.vencendo > 0 ? (
        <span className="rounded-full border border-status-expiring/30 bg-status-expiring/12 px-2 py-0.5 text-status-expiring">
          {resumo.vencendo} vencendo
        </span>
      ) : null}
      {resumo.pendentes > 0 ? (
        <span className="rounded-full border border-status-pending/30 bg-status-pending/12 px-2 py-0.5 text-status-pending">
          {resumo.pendentes} em processo
        </span>
      ) : null}
    </div>
  );
}
