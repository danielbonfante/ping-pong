"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameCanvas, { type MotorJogo } from "./GameCanvas";
import { criarEstadoInicial } from "./simulacao";
import { CAMPO_ONLINE_ALTURA, CAMPO_ONLINE_LARGURA } from "./constantesFisica";
import { abrirConexao, enviar, type MensagemRecebida } from "@/lib/ws-client";

type FaseOnline =
  | { tipo: "conectando" }
  | { tipo: "aguardando"; codigo: string }
  | { tipo: "jogando" }
  | { tipo: "encerrada"; vencedor: "esquerda" | "direita"; golsEsquerda: number; golsDireita: number }
  | { tipo: "erro"; mensagem: string };

const TEMPO_LIMITE_CONEXAO_MS = 8000;

interface PartidaOnlineProps {
  nomeJogador: string;
  papel: "anfitriao" | "convidado";
  /** Obrigatório quando papel === "convidado". */
  codigoSala?: string;
}

/**
 * Cobre o ciclo de vida inteiro de uma partida online — conectar, criar
 * ou entrar na sala, jogar e mostrar o resultado — numa única página
 * montada, sem navegação no meio. Trocar de rota fecharia o WebSocket e
 * este projeto ainda não suporta reconexão (limitação conhecida do MVP,
 * ver shared/protocol.md).
 */
export default function PartidaOnline({ nomeJogador, papel, codigoSala }: PartidaOnlineProps) {
  const router = useRouter();
  const [fase, setFase] = useState<FaseOnline>({ tipo: "conectando" });
  const [meuLado, setMeuLado] = useState<"esquerda" | "direita" | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const estadoRef = useRef(
    criarEstadoInicial(nomeJogador, "", CAMPO_ONLINE_LARGURA, CAMPO_ONLINE_ALTURA)
  );
  const nomeOponenteRef = useRef("");

  useEffect(() => {
    let fechadoIntencionalmente = false;

    const ws = abrirConexao(aoReceberMensagem);
    wsRef.current = ws;

    const timeoutConexao = setTimeout(() => {
      setFase((atual) =>
        atual.tipo === "conectando"
          ? { tipo: "erro", mensagem: "Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo." }
          : atual
      );
    }, TEMPO_LIMITE_CONEXAO_MS);

    ws.addEventListener("open", () => {
      clearTimeout(timeoutConexao);
      if (papel === "anfitriao") {
        enviar(ws, { type: "create_room", playerName: nomeJogador });
      } else if (codigoSala) {
        enviar(ws, { type: "join_room", code: codigoSala, playerName: nomeJogador });
      }
    });

    ws.addEventListener("error", () => {
      if (fechadoIntencionalmente) return;
      setFase({ tipo: "erro", mensagem: "Não foi possível conectar ao servidor." });
    });

    ws.addEventListener("close", () => {
      if (fechadoIntencionalmente) return;
      setFase((atual) =>
        atual.tipo === "encerrada" || atual.tipo === "erro"
          ? atual
          : { tipo: "erro", mensagem: "A conexão com o servidor caiu." }
      );
    });

    function aoReceberMensagem(mensagem: MensagemRecebida) {
      switch (mensagem.type) {
        case "room_created":
          setFase({ tipo: "aguardando", codigo: mensagem.code });
          break;
        case "joined":
          nomeOponenteRef.current = mensagem.opponentName;
          setFase({ tipo: "aguardando", codigo: mensagem.code });
          break;
        case "opponent_joined":
          nomeOponenteRef.current = mensagem.opponentName;
          break;
        case "match_start": {
          const estado = estadoRef.current;
          const lado = mensagem.you === "left" ? "esquerda" : "direita";
          if (lado === "esquerda") {
            estado.nomeEsquerda = nomeJogador;
            estado.nomeDireita = nomeOponenteRef.current;
          } else {
            estado.nomeDireita = nomeJogador;
            estado.nomeEsquerda = nomeOponenteRef.current;
          }
          setMeuLado(lado);
          setFase({ tipo: "jogando" });
          break;
        }
        case "state": {
          const estado = estadoRef.current;
          estado.bola.x = mensagem.ball.x;
          estado.bola.y = mensagem.ball.y;
          estado.paddleEsquerda.y = mensagem.paddles.left;
          estado.paddleDireita.y = mensagem.paddles.right;
          estado.golsEsquerda = mensagem.score.left;
          estado.golsDireita = mensagem.score.right;
          break;
        }
        case "match_end":
          setFase({
            tipo: "encerrada",
            vencedor: mensagem.winner === "left" ? "esquerda" : "direita",
            golsEsquerda: mensagem.score.left,
            golsDireita: mensagem.score.right,
          });
          break;
        case "opponent_disconnected":
          setFase({ tipo: "erro", mensagem: "O oponente desconectou." });
          break;
        case "error":
          setFase({ tipo: "erro", mensagem: mensagem.message });
          break;
      }
    }

    return () => {
      fechadoIntencionalmente = true;
      clearTimeout(timeoutConexao);
      ws.close();
    };
  }, [nomeJogador, papel, codigoSala]);

  useEffect(() => {
    if (fase.tipo !== "jogando") return;

    const teclas = new Set<string>();
    let ultimaDirecao: "up" | "down" | "none" = "none";

    function direcaoAtual(): "up" | "down" | "none" {
      if (teclas.has("ArrowUp")) return "up";
      if (teclas.has("ArrowDown")) return "down";
      return "none";
    }

    function enviarSeMudou() {
      const direcao = direcaoAtual();
      if (direcao === ultimaDirecao) return;
      ultimaDirecao = direcao;
      const ws = wsRef.current;
      if (ws) enviar(ws, { type: "paddle_input", direction: direcao });
    }

    function aoKeyDown(evento: KeyboardEvent) {
      if (evento.code !== "ArrowUp" && evento.code !== "ArrowDown") return;
      evento.preventDefault();
      teclas.add(evento.code);
      enviarSeMudou();
    }
    function aoKeyUp(evento: KeyboardEvent) {
      teclas.delete(evento.code);
      enviarSeMudou();
    }
    function aoPerderFoco() {
      teclas.clear();
      enviarSeMudou();
    }

    window.addEventListener("keydown", aoKeyDown);
    window.addEventListener("keyup", aoKeyUp);
    window.addEventListener("blur", aoPerderFoco);
    return () => {
      window.removeEventListener("keydown", aoKeyDown);
      window.removeEventListener("keyup", aoKeyUp);
      window.removeEventListener("blur", aoPerderFoco);
    };
  }, [fase.tipo]);

  const motor = useMemo<MotorJogo>(() => ({ estadoRef }), []);
  const campoFixo = useMemo(() => ({ w: CAMPO_ONLINE_LARGURA, h: CAMPO_ONLINE_ALTURA }), []);
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  async function copiarCodigo(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 2000);
    } catch {
      // clipboard indisponível (ex.: contexto não seguro) — sem problema,
      // o código já está visível na tela para copiar manualmente.
    }
  }

  if (fase.tipo === "conectando") {
    return (
      <div className="tela-inicial">
        <div className="painel">
          <h1>CONECTANDO…</h1>
        </div>
      </div>
    );
  }

  if (fase.tipo === "aguardando") {
    return (
      <div className="tela-inicial">
        <div className="painel">
          <h1>SALA {fase.codigo}</h1>
          <p className="subtitulo">Compartilhe o código com quem vai jogar com você.</p>
          <p className="subtitulo">Aguardando o oponente entrar… Controles: setas ↑ / ↓</p>
          <div className="acoes-modal">
            <button type="button" onClick={() => copiarCodigo(fase.codigo)}>
              {codigoCopiado ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO"}
            </button>
            <button type="button" className="botao-secundario" onClick={() => router.push("/")}>
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fase.tipo === "erro") {
    return (
      <div className="tela-inicial">
        <div className="painel">
          <h1>OPS</h1>
          <p className="subtitulo">{fase.mensagem}</p>
          <div className="acoes-modal">
            <button type="button" onClick={() => router.push("/")}>
              VOLTAR AO MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  const venceu = fase.tipo === "encerrada" && fase.vencedor === meuLado;

  return (
    <>
      <GameCanvas motor={motor} ativo={fase.tipo === "jogando"} campoFixo={campoFixo} />
      {fase.tipo === "encerrada" && (
        <div className="tela-inicial">
          <div className="painel">
            <h1>{venceu ? "VOCÊ VENCEU!" : "VOCÊ PERDEU"}</h1>
            <p className="subtitulo">
              {fase.golsEsquerda} – {fase.golsDireita}
            </p>
            <div className="acoes-modal">
              <button type="button" onClick={() => router.push("/")}>
                VOLTAR AO MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
