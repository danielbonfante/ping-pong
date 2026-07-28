"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PartidaOnline from "@/components/game/PartidaOnline";
import PainelJogo from "@/components/ui/PainelJogo";
import {
  getNomeJogadorServerSnapshot,
  getNomeJogadorSnapshot,
  nomeValido,
  subscribeNomeJogador,
} from "@/lib/playerName";

const TAMANHO_CODIGO = 4;

export default function PaginaEntrarSala() {
  const router = useRouter();
  const nomeJogador = useSyncExternalStore(
    subscribeNomeJogador,
    getNomeJogadorSnapshot,
    getNomeJogadorServerSnapshot
  );
  const [codigo, setCodigo] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (!nomeValido(nomeJogador)) router.replace("/");
  }, [nomeJogador, router]);

  if (!nomeValido(nomeJogador)) return null;

  if (confirmado) {
    return <PartidaOnline nomeJogador={nomeJogador} papel="convidado" codigoSala={codigo} />;
  }

  const podeEntrar = codigo.length === TAMANHO_CODIGO;

  return (
    <main className="tela-inicial">
      <PainelJogo titulo="ENTRAR EM SALA">
        <label htmlFor="codigo-sala">Código da sala</label>
        <input
          id="codigo-sala"
          type="text"
          maxLength={TAMANHO_CODIGO}
          autoComplete="off"
          inputMode="text"
          value={codigo}
          onChange={(evento) =>
            setCodigo(
              evento.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, TAMANHO_CODIGO)
            )
          }
          onKeyDown={(evento) => {
            if (evento.key === "Enter" && podeEntrar) setConfirmado(true);
          }}
        />
        <div className="acoes-modal">
          <button type="button" disabled={!podeEntrar} onClick={() => setConfirmado(true)}>
            ENTRAR
          </button>
          <Link href="/" className="botao botao-secundario">
            VOLTAR
          </Link>
        </div>
      </PainelJogo>
    </main>
  );
}
