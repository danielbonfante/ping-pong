"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PainelJogo from "@/components/ui/PainelJogo";
import RankingBoard from "@/components/ui/RankingBoard";
import {
  getNomeJogadorServerSnapshot,
  getNomeJogadorSnapshot,
  nomeValido,
  normalizarNome,
  salvarNomeJogador,
  subscribeNomeJogador,
} from "@/lib/playerName";

export default function Home() {
  const router = useRouter();
  const nomeSalvo = useSyncExternalStore(
    subscribeNomeJogador,
    getNomeJogadorSnapshot,
    getNomeJogadorServerSnapshot
  );
  const [nomeEditado, setNomeEditado] = useState<string | null>(null);
  const nome = nomeEditado ?? nomeSalvo;

  const podeJogar = nomeValido(nome);

  function atualizarNome(valor: string) {
    const normalizado = normalizarNome(valor);
    setNomeEditado(normalizado);
    salvarNomeJogador(normalizado);
  }

  function iniciarContraBot() {
    if (!podeJogar) return;
    router.push("/play/bot");
  }

  return (
    <main className="tela-inicial">
      <PainelJogo titulo="PING PONG!">
        <p className="subtitulo">Primeiro a fazer 5 gols vence.</p>
        <label htmlFor="nome-jogador">Seu nome (até 3 letras)</label>
        <input
          id="nome-jogador"
          type="text"
          maxLength={3}
          autoComplete="off"
          inputMode="text"
          value={nome}
          onChange={(evento) => atualizarNome(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") iniciarContraBot();
          }}
        />
        <RankingBoard />
        <div className="acoes-modal">
          <button type="button" disabled={!podeJogar} onClick={iniciarContraBot}>
            JOGAR CONTRA O BOT
          </button>
          <Link href="/play/local" className="botao botao-secundario">
            MULTIPLAYER LOCAL
          </Link>
          <Link
            href={podeJogar ? "/play/create" : "#"}
            aria-disabled={!podeJogar}
            className="botao botao-secundario"
            onClick={(evento) => {
              if (!podeJogar) evento.preventDefault();
            }}
          >
            CRIAR SALA ONLINE
          </Link>
          <Link
            href={podeJogar ? "/play/join" : "#"}
            aria-disabled={!podeJogar}
            className="botao botao-secundario"
            onClick={(evento) => {
              if (!podeJogar) evento.preventDefault();
            }}
          >
            ENTRAR EM SALA
          </Link>
          <Link href="/ranking" className="botao botao-secundario">
            RANKING
          </Link>
        </div>
      </PainelJogo>
    </main>
  );
}
