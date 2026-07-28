"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import PartidaOnline from "@/components/game/PartidaOnline";
import {
  getNomeJogadorServerSnapshot,
  getNomeJogadorSnapshot,
  nomeValido,
  subscribeNomeJogador,
} from "@/lib/playerName";

export default function PaginaCriarSala() {
  const router = useRouter();
  const nomeJogador = useSyncExternalStore(
    subscribeNomeJogador,
    getNomeJogadorSnapshot,
    getNomeJogadorServerSnapshot
  );

  useEffect(() => {
    if (!nomeValido(nomeJogador)) router.replace("/");
  }, [nomeJogador, router]);

  if (!nomeValido(nomeJogador)) return null;

  return <PartidaOnline nomeJogador={nomeJogador} papel="anfitriao" />;
}
