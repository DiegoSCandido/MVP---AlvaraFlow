import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl font-semibold text-muted-foreground">404</p>
      <p className="text-lg">Pagina nao encontrada.</p>
      <Button asChild>
        <Link to="/dashboard">Voltar ao dashboard</Link>
      </Button>
    </div>
  );
}
