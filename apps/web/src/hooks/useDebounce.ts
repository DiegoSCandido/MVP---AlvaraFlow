import { useEffect, useState } from "react";

/** Adia a propagacao do valor — evita uma requisicao por tecla digitada. */
export function useDebounce<T>(valor: T, atrasoMs = 300): T {
  const [adiado, setAdiado] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setAdiado(valor), atrasoMs);
    return () => clearTimeout(timer);
  }, [valor, atrasoMs]);

  return adiado;
}
