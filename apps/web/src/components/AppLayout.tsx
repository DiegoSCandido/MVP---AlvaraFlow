import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Building2, FileCheck2, LayoutDashboard, LogOut, Menu, Moon, Receipt, Sun, Users } from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const NAVEGACAO = [
  { to: "/dashboard", rotulo: "Dashboard", icone: LayoutDashboard },
  { to: "/clientes", rotulo: "Clientes", icone: Building2 },
  { to: "/alvaras", rotulo: "Alvaras", icone: FileCheck2 },
  { to: "/taxas", rotulo: "Taxas", icone: Receipt },
  { to: "/usuarios", rotulo: "Usuarios", icone: Users, somenteAdmin: true },
] as const;

export function AppLayout() {
  const { usuario, sair } = useAuth();
  const { tema, alternar } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);

  const itens = NAVEGACAO.filter(
    (item) => !("somenteAdmin" in item && item.somenteAdmin) || usuario?.role === "ADMIN",
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          // Em telas grandes a barra acompanha a rolagem da pagina; em telas
          // pequenas vira uma gaveta sobreposta.
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          menuAberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b px-5">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {itens.map(({ to, rotulo, icone: Icone }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icone className="size-4" />
              {rotulo}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium">{usuario?.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{usuario?.email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={alternar}>
            {tema === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {tema === "dark" ? "Tema claro" : "Tema escuro"}
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={sair}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </aside>

      {menuAberto ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMenuAberto(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-card px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </Button>
          <LogoMark className="size-7" />
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
