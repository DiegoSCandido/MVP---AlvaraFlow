import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import Alvaras from "@/pages/Alvaras";
import Clientes from "@/pages/Clientes";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Taxas from "@/pages/Taxas";
import Usuarios from "@/pages/Usuarios";

export default function App() {
  const { usuario, carregando } = useAuth();

  // Enquanto o token guardado e revalidado, nao decide a rota.
  if (carregando) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/alvaras" element={<Alvaras />} />
        <Route path="/taxas" element={<Taxas />} />
        <Route
          path="/usuarios"
          element={usuario.role === "ADMIN" ? <Usuarios /> : <Navigate to="/dashboard" replace />}
        />
      </Route>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
