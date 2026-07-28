const CHAVE_NOME = "ping-pong-nome-jogador";
const PADRAO_NOME = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{1,3}$/u;

let cache: string | null = null;
const ouvintes = new Set<() => void>();

function notificar() {
  cache = null;
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function nomeValido(nome: string): boolean {
  return PADRAO_NOME.test(nome);
}

export function normalizarNome(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/gu, "")
    .slice(0, 3);
}

export function salvarNomeJogador(nome: string) {
  localStorage.setItem(CHAVE_NOME, nome);
  notificar();
}

/** Assinatura para `useSyncExternalStore`: permite ler localStorage com segurança na hidratação. */
export function subscribeNomeJogador(callback: () => void): () => void {
  ouvintes.add(callback);
  function aoStorage(evento: StorageEvent) {
    if (evento.key === null || evento.key === CHAVE_NOME) notificar();
  }
  window.addEventListener("storage", aoStorage);
  return () => {
    ouvintes.delete(callback);
    window.removeEventListener("storage", aoStorage);
  };
}

export function getNomeJogadorSnapshot(): string {
  if (cache === null) cache = localStorage.getItem(CHAVE_NOME) || "";
  return cache;
}

export function getNomeJogadorServerSnapshot(): string {
  return "";
}
