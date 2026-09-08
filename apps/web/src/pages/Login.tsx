import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const CREDENCIAIS_DEMO = { email: "admin@alvaraflow.dev", senha: "Demo@1234" };

export default function Login() {
  const { usuario, entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/dashboard" replace />;

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      await entrar(email, senha);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Nao foi possivel entrar");
    } finally {
      setEnviando(false);
    }
  }

  function preencherDemo() {
    setEmail(CREDENCIAIS_DEMO.email);
    setSenha(CREDENCIAIS_DEMO.senha);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <Logo className="justify-center" />

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse o painel de alvaras e licencas.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={aoEnviar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              {erro ? (
                <p role="alert" className="text-sm text-destructive">
                  {erro}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-card p-4 text-sm">
          <p className="font-medium">Ambiente de demonstracao</p>
          <p className="mt-1 text-muted-foreground">
            {CREDENCIAIS_DEMO.email} / {CREDENCIAIS_DEMO.senha}
          </p>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={preencherDemo}>
            Preencher credenciais
          </Button>
        </div>
      </div>
    </div>
  );
}
