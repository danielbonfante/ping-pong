package room

import (
	"log"
	"sync"
	"time"

	"pingpong/server/internal/game"
	"pingpong/server/internal/protocol"
	"pingpong/server/internal/ranking"
)

// partida liga o motor de física (pacote game, sem I/O) às duas conexões
// da sala: aplica os inputs recebidos, roda o tick loop e transmite os
// snapshots resultantes. Vive dentro de uma Sala assim que o segundo
// jogador entra.
type partida struct {
	estado *game.Estado

	esquerda Jogador
	direita  Jogador

	ranking *ranking.Store // pode ser nil (ex.: em testes)

	// aoEncerrar roda quando a partida termina, por vitória ou por
	// encerrar() — usado pelo Hub para remover a sala do mapa.
	aoEncerrar func()

	parar       chan struct{}
	pararUmaVez sync.Once
}

func iniciarPartida(anfitriao, convidado Jogador, rankingStore *ranking.Store, aoEncerrar func()) *partida {
	p := &partida{
		estado:     game.NovoEstado(),
		esquerda:   anfitriao,
		direita:    convidado,
		ranking:    rankingStore,
		aoEncerrar: aoEncerrar,
		parar:      make(chan struct{}),
	}

	enviar(p.esquerda, protocol.NovaPartidaIniciada(string(game.LadoEsquerda), game.CampoLargura, game.CampoAltura))
	enviar(p.direita, protocol.NovaPartidaIniciada(string(game.LadoDireita), game.CampoLargura, game.CampoAltura))

	go p.loop()
	return p
}

func (p *partida) loop() {
	ticker := time.NewTicker(time.Second / game.TaxaTick)
	defer ticker.Stop()

	for {
		select {
		case <-p.parar:
			return
		case <-ticker.C:
			game.AvancarSimulacao(p.estado)
			p.transmitirEstado()
			if p.estado.Vencedor != game.SemVencedor {
				p.transmitirFim()
				p.registrarRanking()
				if p.aoEncerrar != nil {
					p.aoEncerrar()
				}
				return
			}
		}
	}
}

// receberInput aplica a direção informada ao paddle do jogador que a
// enviou; ignora entradas de quem não está nesta partida.
func (p *partida) receberInput(jogador Jogador, entrada game.EntradaPaddle) {
	switch jogador {
	case p.esquerda:
		p.estado.PaddleEsquerda.Entrada = entrada
	case p.direita:
		p.estado.PaddleDireita.Entrada = entrada
	}
}

func (p *partida) transmitirEstado() {
	estado := p.estado
	msg := protocol.NovoEstadoPartida(
		estado.Tick,
		estado.Bola.X, estado.Bola.Y,
		estado.PaddleEsquerda.Y, estado.PaddleDireita.Y,
		estado.Placar.Esquerda, estado.Placar.Direita,
	)
	enviar(p.esquerda, msg)
	enviar(p.direita, msg)
}

// registrarRanking grava o resultado da partida do ponto de vista de
// cada jogador. Só chamada quando a partida termina naturalmente (com
// vencedor) — abandonos não geram registro.
func (p *partida) registrarRanking() {
	if p.ranking == nil {
		return
	}
	placar := p.estado.Placar
	if err := p.ranking.RegistrarResultado(p.esquerda.Nome(), placar.Esquerda, placar.Direita); err != nil {
		log.Printf("erro ao registrar ranking (%q): %v", p.esquerda.Nome(), err)
	}
	if err := p.ranking.RegistrarResultado(p.direita.Nome(), placar.Direita, placar.Esquerda); err != nil {
		log.Printf("erro ao registrar ranking (%q): %v", p.direita.Nome(), err)
	}
}

func (p *partida) transmitirFim() {
	msg := protocol.NovaPartidaEncerrada(
		string(p.estado.Vencedor),
		p.estado.Placar.Esquerda, p.estado.Placar.Direita,
	)
	enviar(p.esquerda, msg)
	enviar(p.direita, msg)
}

// encerrar para o loop de tick; seguro chamar mais de uma vez.
func (p *partida) encerrar() {
	p.pararUmaVez.Do(func() { close(p.parar) })
}
