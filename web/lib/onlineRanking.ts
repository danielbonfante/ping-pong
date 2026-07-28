import type { ResultadoRanking } from "./ranking";

function urlApi(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
}

/** Busca o Top 5 de partidas online no servidor Go. */
export async function buscarRankingOnline(): Promise<ResultadoRanking[]> {
  const resposta = await fetch(`${urlApi()}/api/ranking`);
  if (!resposta.ok) throw new Error(`falha ao buscar ranking online: ${resposta.status}`);
  return resposta.json();
}
