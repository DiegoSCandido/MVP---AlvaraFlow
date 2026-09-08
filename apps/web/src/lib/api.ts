import type {
  Alvara,
  Cliente,
  DashboardResponse,
  TaxasResponse,
  Usuario,
} from "@/types/domain";

/** Em dev fica vazio e o proxy do Vite encaminha /api para a API local. */
const API_BASE = import.meta.env.VITE_API_URL || "/api";

const TOKEN_KEY = "alvaraflow.token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = {
  method?: string;
  body?: unknown;
  /** Requisicoes de login/cadastro nao enviam Authorization. */
  skipAuth?: boolean;
};

async function request<T>(endpoint: string, { method = "GET", body, skipAuth }: Options = {}): Promise<T> {
  const token = skipAuth ? null : tokenStorage.get();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuth) {
    tokenStorage.clear();
    // Deixa o AuthProvider redirecionar; aqui apenas sinaliza a sessao perdida.
    window.dispatchEvent(new Event("alvaraflow:unauthorized"));
  }

  if (response.status === 204) return null as T;

  const texto = await response.text();
  const dados = texto ? safeJson(texto) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      dados?.error ?? `Erro ${response.status} ao chamar ${endpoint}`,
      dados?.details,
    );
  }

  return dados as T;
}

/** Formato de erro devolvido pela API. */
interface CorpoResposta {
  error?: string;
  details?: Array<{ path: string; message: string }>;
}

/** Uma resposta nao-JSON (proxy fora do ar, HTML de erro) vira uma mensagem legivel. */
function safeJson(texto: string): CorpoResposta | null {
  try {
    return JSON.parse(texto) as CorpoResposta;
  } catch {
    return { error: texto.slice(0, 200) };
  }
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== "") search.set(chave, String(valor));
  }
  const texto = search.toString();
  return texto ? `?${texto}` : "";
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: Usuario; mustChangePassword: boolean }>("/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      }),
    register: (body: { email: string; password: string; fullName: string }) =>
      request<Usuario>("/auth/register", { method: "POST", body, skipAuth: true }),
    me: () => request<Usuario>("/auth/me"),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<null>("/auth/change-password", {
        method: "PUT",
        body: { currentPassword, newPassword },
      }),
  },

  users: {
    list: () => request<Usuario[]>("/users"),
    remove: (id: string) => request<null>(`/users/${id}`, { method: "DELETE" }),
  },

  clientes: {
    list: (params: { busca?: string; uf?: string; situacao?: string } = {}) =>
      request<Cliente[]>(`/clientes${query(params)}`),
    get: (id: string) => request<Cliente>(`/clientes/${id}`),
    create: (body: unknown) => request<Cliente>("/clientes", { method: "POST", body }),
    update: (id: string, body: unknown) => request<Cliente>(`/clientes/${id}`, { method: "PUT", body }),
    remove: (id: string) => request<null>(`/clientes/${id}`, { method: "DELETE" }),
  },

  alvaras: {
    list: (params: { busca?: string; tipo?: string; status?: string; clienteId?: string } = {}) =>
      request<Alvara[]>(`/alvaras${query(params)}`),
    create: (body: unknown) => request<Alvara>("/alvaras", { method: "POST", body }),
    update: (id: string, body: unknown) => request<Alvara>(`/alvaras/${id}`, { method: "PUT", body }),
    finalizar: (id: string, body: { issueDate: string; expirationDate?: string | null }) =>
      request<Alvara>(`/alvaras/${id}/finalizar`, { method: "POST", body }),
    remove: (id: string) => request<null>(`/alvaras/${id}`, { method: "DELETE" }),
  },

  taxas: {
    list: (params: { ano?: number; situacao?: string } = {}) =>
      request<TaxasResponse>(`/taxas${query(params)}`),
    salvar: (body: unknown) => request<unknown>("/taxas", { method: "PUT", body }),
  },

  dashboard: {
    get: () => request<DashboardResponse>("/dashboard"),
  },
};
