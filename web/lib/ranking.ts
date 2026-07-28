export type ResultadoRanking = {
  nome: string;
  golsFeitos: number;
  golsSofridos: number;
  criadoEm: number;
};

const CHAVE_RANKING = "ping-pong-top-5";
const RANKING_VAZIO: ResultadoRanking[] = [];

let cache: ResultadoRanking[] | null = null;
const ouvintes = new Set<() => void>();

function notificar() {
  cache = null;
  ouvintes.forEach((ouvinte) => ouvinte());
}

function resultadoValido(resultado: unknown): resultado is ResultadoRanking {
  if (!resultado || typeof resultado !== "object") return false;
  const r = resultado as Record<string, unknown>;
  return (
    typeof r.nome === "string" &&
    Number.isInteger(r.golsFeitos) &&
    Number.isInteger(r.golsSofridos) &&
    Number.isFinite(r.criadoEm)
  );
}

function lerRanking(): ResultadoRanking[] {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_RANKING) || "[]");
    return Array.isArray(dados) ? dados.filter(resultadoValido) : [];
  } catch {
    return [];
  }
}

function ordenar(ranking: ResultadoRanking[]): ResultadoRanking[] {
  return [...ranking].sort(
    (a, b) =>
      b.golsFeitos - a.golsFeitos ||
      a.golsSofridos - b.golsSofridos ||
      b.criadoEm - a.criadoEm
  );
}

function calcularTop5(): ResultadoRanking[] {
  return ordenar(lerRanking()).slice(0, 5);
}

export function obterTop5(): ResultadoRanking[] {
  return calcularTop5();
}

export function adicionarResultado(
  nome: string,
  golsFeitos: number,
  golsSofridos: number
): ResultadoRanking[] {
  const ranking = lerRanking();
  ranking.push({ nome, golsFeitos, golsSofridos, criadoEm: Date.now() });
  const top5 = ordenar(ranking).slice(0, 5);
  localStorage.setItem(CHAVE_RANKING, JSON.stringify(top5));
  notificar();
  return top5;
}

/** Assinatura para `useSyncExternalStore`: notifica em mudanças locais e entre abas. */
export function subscribeRanking(callback: () => void): () => void {
  ouvintes.add(callback);
  function aoStorage(evento: StorageEvent) {
    if (evento.key === null || evento.key === CHAVE_RANKING) notificar();
  }
  window.addEventListener("storage", aoStorage);
  return () => {
    ouvintes.delete(callback);
    window.removeEventListener("storage", aoStorage);
  };
}

export function getRankingSnapshot(): ResultadoRanking[] {
  if (cache === null) cache = calcularTop5();
  return cache;
}

export function getRankingServerSnapshot(): ResultadoRanking[] {
  return RANKING_VAZIO;
}
