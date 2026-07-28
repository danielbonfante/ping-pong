import Link from "next/link";
import PainelJogo from "@/components/ui/PainelJogo";
import RankingBoard from "@/components/ui/RankingBoard";
import RankingOnlineBoard from "@/components/ui/RankingOnlineBoard";

export default function RankingPage() {
  return (
    <main className="tela-inicial">
      <PainelJogo titulo="RANKING">
        <p className="subtitulo">Bot / local (salvo neste navegador)</p>
        <RankingBoard />
        <p className="subtitulo">Online (todos os jogadores)</p>
        <RankingOnlineBoard />
        <div className="acoes-modal">
          <Link href="/" className="botao botao-secundario">
            VOLTAR
          </Link>
        </div>
      </PainelJogo>
    </main>
  );
}
