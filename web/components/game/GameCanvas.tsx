"use client";

import { useEffect, useRef } from "react";
import { desenharEstado } from "./desenharEstado";
import type { EstadoJogo } from "./tipos";

/**
 * Contrato entre o renderer "burro" e uma fonte de estado do jogo.
 * `step` fica ausente quando o estado é alimentado por outra fonte
 * (ex.: mensagens de um WebSocket no modo online) — o GameCanvas nunca
 * precisa saber a diferença.
 */
export interface MotorJogo {
  estadoRef: React.RefObject<EstadoJogo>;
  step?: () => void;
  aoMoverPonteiro?: (yRelativo: number) => void;
  ajustarCampo?: (largura: number, altura: number) => void;
}

interface GameCanvasProps {
  motor: MotorJogo;
  ativo: boolean;
  /**
   * Campo lógico de tamanho fixo (modo online: o servidor simula em
   * 1280x720). Quando presente, o canvas mantém essa resolução interna
   * e só é escalado via CSS (letterbox) para caber na tela — em vez de
   * mudar de tamanho junto com a janela, como nos modos client-only.
   */
  campoFixo?: { w: number; h: number };
}

export default function GameCanvas({ motor, ativo, campoFixo }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ativoRef = useRef(ativo);

  useEffect(() => {
    ativoRef.current = ativo;
  }, [ativo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function ajustarTamanho() {
      if (campoFixo) {
        canvas!.width = campoFixo.w;
        canvas!.height = campoFixo.h;
        const escala = Math.min(window.innerWidth / campoFixo.w, window.innerHeight / campoFixo.h);
        canvas!.style.width = `${campoFixo.w * escala}px`;
        canvas!.style.height = `${campoFixo.h * escala}px`;
        return;
      }

      const largura = window.innerWidth;
      const altura = window.innerHeight;
      canvas!.width = largura;
      canvas!.height = altura;
      motor.ajustarCampo?.(largura, altura);
    }

    ajustarTamanho();
    window.addEventListener("resize", ajustarTamanho);

    let frameId: number;
    function loop() {
      if (ativoRef.current) motor.step?.();
      desenharEstado(ctx!, motor.estadoRef.current);
      frameId = requestAnimationFrame(loop);
    }
    frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", ajustarTamanho);
      cancelAnimationFrame(frameId);
    };
  }, [motor, campoFixo]);

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={(evento) => motor.aoMoverPonteiro?.(evento.clientY)}
    />
  );
}
