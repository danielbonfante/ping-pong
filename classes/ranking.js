const CHAVE_RANKING = "ping-pong-top-5";

function lerRanking() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_RANKING) || "[]");
    return Array.isArray(dados) ? dados.filter(resultadoValido) : [];
  } catch {
    return [];
  }
}

function resultadoValido(resultado) {
  return (
    resultado &&
    typeof resultado.nome === "string" &&
    Number.isInteger(resultado.golsFeitos) &&
    Number.isInteger(resultado.golsSofridos) &&
    Number.isFinite(resultado.criadoEm)
  );
}

function ordenar(ranking) {
  return ranking.sort(
    (a, b) =>
      b.golsFeitos - a.golsFeitos ||
      a.golsSofridos - b.golsSofridos ||
      b.criadoEm - a.criadoEm
  );
}

function obterTop5() {
  return ordenar(lerRanking()).slice(0, 5);
}

function adicionarResultado(nome, golsFeitos, golsSofridos) {
  const ranking = lerRanking();
  ranking.push({ nome, golsFeitos, golsSofridos, criadoEm: Date.now() });
  const top5 = ordenar(ranking).slice(0, 5);
  localStorage.setItem(CHAVE_RANKING, JSON.stringify(top5));
  return top5;
}

export { adicionarResultado, obterTop5 };
