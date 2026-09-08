import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, api } from "@/lib/api";
import { PROCESSING_STATUS_CONFIG, ANDAMENTO_CONFIG } from "@/lib/status";
import { inputDateParaIso, isoParaInputDate } from "@/lib/format";
import { ALVARA_TIPOS, TIPOS_ISENTAVEIS } from "@/types/domain";
import type { Alvara, Andamento, AlvaraTipo, ProcessingStatus } from "@/types/domain";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  alvara?: Alvara | null;
}

const HOJE = () => new Date().toISOString().slice(0, 10);

const VAZIO = {
  clienteId: "",
  tipo: ALVARA_TIPOS[0] as AlvaraTipo,
  requestDate: HOJE(),
  issueDate: "",
  expirationDate: "",
  processingStatus: "lancado" as ProcessingStatus,
  andamento: "" as Andamento | "",
  isento: false,
  semPontoFixo: false,
  protocoloPrefeitura: "",
  notes: "",
};

export function AlvaraFormDialog({ aberto, onOpenChange, alvara }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});

  // A lista de clientes so e buscada quando o dialogo esta aberto.
  const { data: clientes } = useQuery({
    queryKey: ["clientes", "selecao"],
    queryFn: () => api.clientes.list({ situacao: "ativos" }),
    enabled: aberto,
  });

  useEffect(() => {
    if (!aberto) return;
    setErros({});
    setForm(
      alvara
        ? {
            clienteId: alvara.clienteId,
            tipo: alvara.tipo,
            requestDate: isoParaInputDate(alvara.requestDate),
            issueDate: isoParaInputDate(alvara.issueDate),
            expirationDate: isoParaInputDate(alvara.expirationDate),
            processingStatus: alvara.processingStatus,
            andamento: alvara.andamento ?? "",
            isento: alvara.isento,
            semPontoFixo: alvara.semPontoFixo,
            protocoloPrefeitura: alvara.protocoloPrefeitura ?? "",
            notes: alvara.notes ?? "",
          }
        : { ...VAZIO, requestDate: HOJE() },
    );
  }, [aberto, alvara]);

  const podeIsentar = TIPOS_ISENTAVEIS.includes(form.tipo);
  const ehFuncionamento = form.tipo === "Alvara de Funcionamento";

  const salvar = useMutation({
    mutationFn: () => {
      const payload = {
        clienteId: form.clienteId,
        tipo: form.tipo,
        requestDate: inputDateParaIso(form.requestDate),
        issueDate: inputDateParaIso(form.issueDate),
        expirationDate: inputDateParaIso(form.expirationDate),
        processingStatus: form.processingStatus,
        andamento: form.andamento || null,
        // A API rejeita isencao em tipos que nao a admitem.
        isento: podeIsentar && form.isento,
        semPontoFixo: form.semPontoFixo,
        protocoloPrefeitura: ehFuncionamento ? form.protocoloPrefeitura || null : null,
        notes: form.notes || null,
      };

      return alvara ? api.alvaras.update(alvara.id, payload) : api.alvaras.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alvaras"] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(alvara ? "Alvara atualizado" : "Alvara cadastrado");
      onOpenChange(false);
    },
    onError: (erro) => {
      if (erro instanceof ApiError && erro.details) {
        setErros(Object.fromEntries(erro.details.map((d) => [d.path, d.message])));
      }
      toast.error(erro instanceof Error ? erro.message : "Falha ao salvar");
    },
  });

  function campo<K extends keyof typeof VAZIO>(nome: K, valor: (typeof VAZIO)[K]) {
    setForm((atual) => ({ ...atual, [nome]: valor }));
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{alvara ? "Editar alvara" : "Novo alvara"}</DialogTitle>
          <DialogDescription>
            A vigencia (ativo, vencendo, vencido) e calculada a partir das datas informadas.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            setErros({});
            salvar.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="clienteId">Cliente</Label>
            <Select
              value={form.clienteId}
              onValueChange={(valor) => campo("clienteId", valor)}
              disabled={Boolean(alvara)}
            >
              <SelectTrigger id="clienteId">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {clientes?.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.razaoSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.clienteId ? <p className="text-xs text-destructive">{erros.clienteId}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={form.tipo} onValueChange={(valor) => campo("tipo", valor as AlvaraTipo)}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALVARA_TIPOS.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="requestDate">Solicitacao</Label>
              <Input
                id="requestDate"
                type="date"
                required
                value={form.requestDate}
                onChange={(e) => campo("requestDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">Emissao</Label>
              <Input
                id="issueDate"
                type="date"
                value={form.issueDate}
                onChange={(e) => campo("issueDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Validade</Label>
              <Input
                id="expirationDate"
                type="date"
                value={form.expirationDate}
                onChange={(e) => campo("expirationDate", e.target.value)}
              />
              {erros.expirationDate ? (
                <p className="text-xs text-destructive">{erros.expirationDate}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="processingStatus">Status do processo</Label>
              <Select
                value={form.processingStatus}
                onValueChange={(valor) => campo("processingStatus", valor as ProcessingStatus)}
              >
                <SelectTrigger id="processingStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROCESSING_STATUS_CONFIG).map(([valor, config]) => (
                    <SelectItem key={valor} value={valor}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="andamento">Andamento</Label>
              <Select
                value={form.andamento || "sem_andamento"}
                onValueChange={(valor) =>
                  campo("andamento", valor === "sem_andamento" ? "" : (valor as Andamento))
                }
              >
                <SelectTrigger id="andamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_andamento">Sem andamento</SelectItem>
                  {Object.entries(ANDAMENTO_CONFIG).map(([valor, config]) => (
                    <SelectItem key={valor} value={valor}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {ehFuncionamento ? (
            <div className="space-y-2">
              <Label htmlFor="protocoloPrefeitura">Protocolo na prefeitura</Label>
              <Input
                id="protocoloPrefeitura"
                placeholder="2026/1234"
                value={form.protocoloPrefeitura}
                onChange={(e) => campo("protocoloPrefeitura", e.target.value)}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-6 rounded-lg border p-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={podeIsentar && form.isento}
                disabled={!podeIsentar}
                onCheckedChange={(valor) => campo("isento", valor === true)}
              />
              Isento de taxa
              {!podeIsentar ? (
                <span className="text-xs text-muted-foreground">(nao se aplica a este tipo)</span>
              ) : null}
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.semPontoFixo}
                onCheckedChange={(valor) => campo("semPontoFixo", valor === true)}
              />
              Sem ponto fixo
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observacoes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => campo("notes", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending || !form.clienteId}>
              {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
