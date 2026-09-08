import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleDashed, Receipt, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { TaxaSituacaoBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatarCnpj, formatarMoeda } from "@/lib/format";
import type { LinhaTaxa, TaxaSituacao } from "@/types/domain";

const TODAS = "todas";

/** Anos oferecidos no seletor: o atual e os quatro anteriores. */
function anosDisponiveis() {
  const atual = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => atual - i);
}

export default function Taxas() {
  const queryClient = useQueryClient();
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [situacao, setSituacao] = useState<string>(TODAS);

  const { data, isLoading } = useQuery({
    queryKey: ["taxas", ano, situacao],
    queryFn: () => api.taxas.list({ ano, situacao: situacao === TODAS ? undefined : situacao }),
  });

  const salvar = useMutation({
    mutationFn: (linha: LinhaTaxa & { campos: Partial<Record<"gerada" | "enviada" | "paga", boolean>> }) =>
      api.taxas.salvar({
        clienteId: linha.clienteId,
        ano,
        gerada: linha.taxa?.gerada ?? false,
        enviada: linha.taxa?.enviada ?? false,
        paga: linha.taxa?.paga ?? false,
        protocolo: linha.taxa?.protocolo ?? "",
        valor: linha.taxa?.valor ?? null,
        ...linha.campos,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["taxas"] }),
    onError: (erro) => toast.error(erro instanceof Error ? erro.message : "Falha ao salvar a taxa"),
  });

  /**
   * As tres etapas sao sequenciais: marcar uma adianta as anteriores e
   * desmarcar uma cancela as seguintes.
   */
  function alternar(linha: LinhaTaxa, etapa: "gerada" | "enviada" | "paga", marcado: boolean) {
    const campos: Partial<Record<"gerada" | "enviada" | "paga", boolean>> = { [etapa]: marcado };

    if (marcado) {
      if (etapa === "paga") Object.assign(campos, { gerada: true, enviada: true });
      if (etapa === "enviada") Object.assign(campos, { gerada: true });
    } else {
      if (etapa === "gerada") Object.assign(campos, { enviada: false, paga: false });
      if (etapa === "enviada") Object.assign(campos, { paga: false });
    }

    salvar.mutate({ ...linha, campos });
  }

  function alternarSituacao(alvo: TaxaSituacao) {
    setSituacao((atual) => (atual === alvo ? TODAS : alvo));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Taxa de funcionamento"
        descricao="Acompanhamento da guia anual, do lancamento ao pagamento."
        acoes={
          <Select value={String(ano)} onValueChange={(valor) => setAno(Number(valor))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis().map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Pagas"
          valor={data?.resumo.pagas ?? 0}
          icone={CircleCheck}
          tom="valid"
          ativo={situacao === "paga"}
          onClick={() => alternarSituacao("paga")}
        />
        <StatCard
          titulo="Aguardando pagamento"
          valor={data?.resumo.aguardandoPagamento ?? 0}
          icone={Receipt}
          tom="expiring"
          ativo={situacao === "enviada"}
          onClick={() => alternarSituacao("enviada")}
        />
        <StatCard
          titulo="Aguardando envio"
          valor={data?.resumo.aguardandoEnvio ?? 0}
          icone={Send}
          tom="pending"
          ativo={situacao === "gerada"}
          onClick={() => alternarSituacao("gerada")}
        />
        <StatCard
          titulo="Nao iniciadas"
          valor={data?.resumo.naoIniciadas ?? 0}
          icone={CircleDashed}
          tom="expired"
          ativo={situacao === "nao_iniciada"}
          onClick={() => alternarSituacao("nao_iniciada")}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !data?.linhas.length ? (
            <EmptyState
              icone={Receipt}
              titulo="Nenhuma linha para este filtro"
              descricao={`Nenhum cliente ativo com essa situacao em ${ano}.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Municipio</TableHead>
                    <TableHead className="text-center">Guia gerada</TableHead>
                    <TableHead className="text-center">Enviada</TableHead>
                    <TableHead className="text-center">Paga</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Situacao</TableHead>
                    <TableHead>Alvara func.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.linhas.map((linha) => (
                    <TableRow key={linha.clienteId}>
                      <TableCell>
                        <p className="font-medium">{linha.razaoSocial}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {formatarCnpj(linha.cnpj)}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {linha.municipio}/{linha.uf}
                      </TableCell>

                      {(["gerada", "enviada", "paga"] as const).map((etapa) => (
                        <TableCell key={etapa} className="text-center">
                          <Checkbox
                            checked={linha.taxa?.[etapa] ?? false}
                            aria-label={`${etapa} — ${linha.razaoSocial}`}
                            onCheckedChange={(valor) => alternar(linha, etapa, valor === true)}
                          />
                        </TableCell>
                      ))}

                      <TableCell className="whitespace-nowrap tabular-nums">
                        {formatarMoeda(linha.taxa?.valor)}
                      </TableCell>
                      <TableCell>
                        <TaxaSituacaoBadge situacao={linha.situacao} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {!linha.alvaraFuncionamento
                          ? "Sem alvara"
                          : linha.alvaraFuncionamento.emAberto
                            ? "Processo em aberto"
                            : "Finalizado"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
