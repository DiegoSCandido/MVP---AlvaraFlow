import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ApiError, api } from "@/lib/api";
import { mascararCnpj } from "@/lib/format";
import type { Cliente } from "@/types/domain";

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE",
  "PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  /** Ausente = criacao. */
  cliente?: Cliente | null;
}

const VAZIO = {
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  uf: "SC",
  municipio: "",
  atividadePrincipalCodigo: "",
  atividadePrincipalDescricao: "",
  ativo: true,
  semAtividade: false,
  isNovo: false,
};

export function ClienteFormDialog({ aberto, onOpenChange, cliente }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});

  // Recarrega o formulario sempre que o dialogo abre para outro cliente.
  useEffect(() => {
    if (!aberto) return;
    setErros({});
    setForm(
      cliente
        ? {
            cnpj: mascararCnpj(cliente.cnpj),
            razaoSocial: cliente.razaoSocial,
            nomeFantasia: cliente.nomeFantasia,
            uf: cliente.uf,
            municipio: cliente.municipio,
            atividadePrincipalCodigo: cliente.atividadePrincipalCodigo,
            atividadePrincipalDescricao: cliente.atividadePrincipalDescricao,
            ativo: cliente.ativo,
            semAtividade: cliente.semAtividade,
            isNovo: cliente.isNovo,
          }
        : VAZIO,
    );
  }, [aberto, cliente]);

  const salvar = useMutation({
    mutationFn: (dados: typeof VAZIO) =>
      cliente ? api.clientes.update(cliente.id, dados) : api.clientes.create(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(cliente ? "Cliente atualizado" : "Cliente cadastrado");
      onOpenChange(false);
    },
    onError: (erro) => {
      if (erro instanceof ApiError && erro.details) {
        setErros(Object.fromEntries(erro.details.map((d) => [d.path, d.message])));
      }
      toast.error(erro instanceof Error ? erro.message : "Falha ao salvar");
    },
  });

  function campo(nome: keyof typeof VAZIO, valor: string | boolean) {
    setForm((atual) => ({ ...atual, [nome]: valor }));
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Dados cadastrais usados no acompanhamento de alvaras e taxas.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            setErros({});
            salvar.mutate(form);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="cnpj" rotulo="CNPJ" erro={erros.cnpj}>
              <Input
                id="cnpj"
                required
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={(e) => campo("cnpj", mascararCnpj(e.target.value))}
              />
            </Campo>

            <Campo id="municipio" rotulo="Municipio" erro={erros.municipio}>
              <Input
                id="municipio"
                required
                value={form.municipio}
                onChange={(e) => campo("municipio", e.target.value)}
              />
            </Campo>
          </div>

          <Campo id="razaoSocial" rotulo="Razao social" erro={erros.razaoSocial}>
            <Input
              id="razaoSocial"
              required
              value={form.razaoSocial}
              onChange={(e) => campo("razaoSocial", e.target.value)}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Campo id="nomeFantasia" rotulo="Nome fantasia">
              <Input
                id="nomeFantasia"
                value={form.nomeFantasia}
                onChange={(e) => campo("nomeFantasia", e.target.value)}
              />
            </Campo>

            <Campo id="uf" rotulo="UF" erro={erros.uf}>
              <Select value={form.uf} onValueChange={(valor) => campo("uf", valor)}>
                <SelectTrigger id="uf">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {UFS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <Campo id="cnae" rotulo="CNAE principal">
              <Input
                id="cnae"
                placeholder="0000-0/00"
                value={form.atividadePrincipalCodigo}
                onChange={(e) => campo("atividadePrincipalCodigo", e.target.value)}
              />
            </Campo>

            <Campo id="cnaeDescricao" rotulo="Descricao da atividade">
              <Input
                id="cnaeDescricao"
                value={form.atividadePrincipalDescricao}
                onChange={(e) => campo("atividadePrincipalDescricao", e.target.value)}
              />
            </Campo>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <Alternador
              id="ativo"
              rotulo="Cliente ativo"
              descricao="Desmarque para arquivar o cliente sem excluir o historico."
              marcado={form.ativo}
              onChange={(valor) => {
                // "Sem atividade" so existe dentro dos ativos.
                setForm((atual) => ({
                  ...atual,
                  ativo: valor,
                  semAtividade: valor ? atual.semAtividade : false,
                }));
              }}
            />
            <Alternador
              id="semAtividade"
              rotulo="Sem atividade"
              descricao="Pausa operacional: continua ativo, mas fora das rotinas do mes."
              marcado={form.semAtividade}
              desabilitado={!form.ativo}
              onChange={(valor) => campo("semAtividade", valor)}
            />
            <Alternador
              id="isNovo"
              rotulo="Marcar como novo"
              descricao="Sinaliza cadastro recente que ainda precisa de conferencia."
              marcado={form.isNovo}
              onChange={(valor) => campo("isNovo", valor)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending}>
              {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Campo({
  id,
  rotulo,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
      {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
    </div>
  );
}

function Alternador({
  id,
  rotulo,
  descricao,
  marcado,
  desabilitado,
  onChange,
}: {
  id: string;
  rotulo: string;
  descricao: string;
  marcado: boolean;
  desabilitado?: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={marcado}
        disabled={desabilitado}
        onCheckedChange={(valor) => onChange(valor === true)}
        className="mt-0.5"
      />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="font-medium">
          {rotulo}
        </Label>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </div>
    </div>
  );
}
