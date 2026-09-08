import { useCallback, useSyncExternalStore } from "react";

export type Tema = "light" | "dark";

const CHAVE = "alvaraflow.tema";

function temaInicial(): Tema {
  const salvo = localStorage.getItem(CHAVE);
  if (salvo === "light" || salvo === "dark") return salvo;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Store fora do React: o tema e lido por componentes distantes (layout e
 * toasts) e um estado local em cada um deles sairia de sincronia.
 * O Tailwind opera em darkMode: "class", entao basta a classe na raiz.
 */
let tema: Tema = temaInicial();
const inscritos = new Set<() => void>();

function aplicar(novo: Tema) {
  tema = novo;
  document.documentElement.classList.toggle("dark", novo === "dark");
  localStorage.setItem(CHAVE, novo);
  inscritos.forEach((notificar) => notificar());
}

// Aplica o tema inicial antes da primeira renderizacao.
aplicar(tema);

function inscrever(notificar: () => void) {
  inscritos.add(notificar);
  return () => {
    inscritos.delete(notificar);
  };
}

export function useTheme() {
  const atual = useSyncExternalStore(
    inscrever,
    () => tema,
    () => "light" as Tema,
  );

  const alternar = useCallback(() => aplicar(tema === "dark" ? "light" : "dark"), []);

  return { tema: atual, alternar };
}
