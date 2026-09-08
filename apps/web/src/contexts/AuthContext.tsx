import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, tokenStorage } from "@/lib/api";
import type { Usuario } from "@/types/domain";

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Comeca carregando quando ha token: e preciso validar antes de decidir a rota.
  const [carregando, setCarregando] = useState(() => Boolean(tokenStorage.get()));

  const sair = useCallback(() => {
    tokenStorage.clear();
    setUsuario(null);
  }, []);

  // Revalida o token guardado ao abrir o app (ele pode ter expirado).
  useEffect(() => {
    if (!tokenStorage.get()) return;

    let ativo = true;
    api.auth
      .me()
      .then((dados) => ativo && setUsuario(dados))
      .catch(() => ativo && sair())
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [sair]);

  // Qualquer 401 vindo da camada de API encerra a sessao.
  useEffect(() => {
    window.addEventListener("alvaraflow:unauthorized", sair);
    return () => window.removeEventListener("alvaraflow:unauthorized", sair);
  }, [sair]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const { token, user } = await api.auth.login(email, senha);
    tokenStorage.set(token);
    setUsuario(user);
  }, []);

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, sair }),
    [usuario, carregando, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return contexto;
}
