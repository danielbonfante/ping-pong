package room

import "time"

type Estado int

const (
	EstadoAguardando Estado = iota
	EstadoAtiva
	EstadoEncerrada
)

// Sala representa uma partida (ou espera por uma) identificada por um
// código curto. Por enquanto guarda só os dois jogadores conectados —
// o estado autoritativo da partida (bola, placar) chega no próximo marco.
type Sala struct {
	Codigo    string
	Anfitriao Jogador
	Convidado Jogador
	Estado    Estado
	CriadaEm  time.Time

	partida *partida // nil até o segundo jogador entrar
}
