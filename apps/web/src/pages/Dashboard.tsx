import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Building2, CircleCheck, Clock, FileCheck2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatarData, textoPrazo } from "@/lib/format";

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard.get,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Dashboard" descricao="Visao geral da carteira." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  // Recharts espera uma lista; o backend devolve um mapa tipo -> total.
  const dadosGrafico = Object.entries(data.porTipo)
    .map(([tipo, total]) => ({ tipo: tipo.replace("Alvara ", "").replace("Alvara", ""), total }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Dashboard"
        descricao={`${data.clientes.ativos} clientes ativos e ${data.alvaras.total} alvaras acompanhados.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Vigentes"
          valor={data.alvaras.validos}
          icone={CircleCheck}
          tom="valid"
          descricao="Dentro do prazo de validade"
        />
        <StatCard
          titulo="Vencendo em 30 dias"
          valor={data.alvaras.vencendo}
          icone={AlertTriangle}
          tom="expiring"
          descricao="Exigem renovacao imediata"
        />
        <StatCard
          titulo="Vencidos"
          valor={data.alvaras.vencidos}
          icone={AlertTriangle}
          tom="expired"
          descricao="Fora do prazo"
        />
        <StatCard
          titulo="Em processo"
          valor={data.alvaras.pendentes}
          icone={Clock}
          tom="pending"
          descricao="Aguardando emissao"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Alvaras por tipo</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="tipo"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={60}
                  className="fill-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  cursor={{ className: "fill-muted/60" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: "0.8125rem",
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Prioridades</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.proximosVencimentos.length === 0 ? (
              <EmptyState
                icone={CircleCheck}
                titulo="Nada vencendo"
                descricao="Nenhum alvara vencido ou proximo do vencimento."
              />
            ) : (
              // Mesma altura util do grafico ao lado, rolando quando ha muitos itens.
              <ul className="max-h-72 divide-y overflow-y-auto">
                {data.proximosVencimentos.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-6 py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/alvaras?busca=${encodeURIComponent(item.cliente.razaoSocial)}`}
                        className="block truncate text-sm font-medium hover:text-primary"
                      >
                        {item.cliente.razaoSocial}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.tipo} · {formatarData(item.expirationDate)} ·{" "}
                        {textoPrazo(item.diasParaVencer)}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          titulo="Clientes ativos"
          valor={data.clientes.ativos}
          icone={Building2}
          descricao={`${data.clientes.inativos} inativos na base`}
        />
        <StatCard titulo="Alvaras cadastrados" valor={data.alvaras.total} icone={FileCheck2} />
      </div>
    </div>
  );
}
