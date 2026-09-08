import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, api } from "@/lib/api";
import { formatarData } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";

const NOVO_VAZIO = { fullName: "", email: "", password: "" };

export default function Usuarios() {
  const queryClient = useQueryClient();
  const { usuario: usuarioAtual } = useAuth();
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [form, setForm] = useState(NOVO_VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: api.users.list,
  });

  const criar = useMutation({
    mutationFn: () => api.auth.register(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuario criado");
      setDialogoAberto(false);
      setForm(NOVO_VAZIO);
    },
    onError: (erro) => {
      if (erro instanceof ApiError && erro.details) {
        setErros(Object.fromEntries(erro.details.map((d) => [d.path, d.message])));
      }
      toast.error(erro instanceof Error ? erro.message : "Falha ao criar usuario");
    },
  });

  const remover = useMutation({
    mutationFn: (id: string) => api.users.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuario removido");
    },
    onError: (erro) => toast.error(erro instanceof Error ? erro.message : "Falha ao remover"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Usuarios"
        descricao="Contas com acesso ao painel. Visivel apenas para administradores."
        acoes={
          <Button
            onClick={() => {
              setErros({});
              setDialogoAberto(true);
            }}
          >
            <Plus className="size-4" />
            Novo usuario
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !usuarios?.length ? (
            <EmptyState icone={Users} titulo="Nenhum usuario cadastrado" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-16 text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.fullName}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <span className="rounded-full border px-2.5 py-0.5 text-xs">
                          {usuario.role === "ADMIN" ? "Administrador" : "Analista"}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatarData(usuario.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover ${usuario.fullName}`}
                          // A API tambem bloqueia a auto-exclusao; aqui e so o feedback visual.
                          disabled={usuario.id === usuarioAtual?.id}
                          onClick={() => remover.mutate(usuario.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo usuario</DialogTitle>
            <DialogDescription>
              A senha precisa ter ao menos 8 caracteres, com maiuscula, minuscula e numero.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(evento) => {
              evento.preventDefault();
              setErros({});
              criar.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              {erros.fullName ? <p className="text-xs text-destructive">{erros.fullName}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="novoEmail">E-mail</Label>
              <Input
                id="novoEmail"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {erros.email ? <p className="text-xs text-destructive">{erros.email}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="novaSenha">Senha</Label>
              <Input
                id="novaSenha"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {erros.password ? <p className="text-xs text-destructive">{erros.password}</p> : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogoAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criar.isPending}>
                {criar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
