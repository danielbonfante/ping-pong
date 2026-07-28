package game

// Lado identifica um dos jogadores. Usa os mesmos literais do protocolo
// (shared/protocol.md) para não precisar de tradução na borda.
type Lado string

const (
	LadoEsquerda Lado = "left"
	LadoDireita  Lado = "right"
	SemVencedor  Lado = ""
)

// EntradaPaddle é a direção que um jogador está segurando — o servidor
// integra a posição a partir disso, nunca aceita posição absoluta do
// cliente.
type EntradaPaddle int

const (
	EntradaNenhuma EntradaPaddle = iota
	EntradaCima
	EntradaBaixo
)

// EntradaDeString converte o valor recebido pelo protocolo ("up" | "down"
// | "none") para o tipo interno. Qualquer valor desconhecido vira
// EntradaNenhuma.
func EntradaDeString(direcao string) EntradaPaddle {
	switch direcao {
	case "up":
		return EntradaCima
	case "down":
		return EntradaBaixo
	default:
		return EntradaNenhuma
	}
}

type Direcao struct {
	X float64
	Y float64
}

type Bola struct {
	X          float64
	Y          float64
	Velocidade float64
	Direcao    Direcao
}

type Paddle struct {
	Y       float64
	Entrada EntradaPaddle
}

type Placar struct {
	Esquerda int
	Direita  int
}

// Estado é o estado autoritativo completo de uma partida em um instante.
// Não conhece rede nem sessão — só física e regras.
type Estado struct {
	Tick           int
	Bola           Bola
	PaddleEsquerda Paddle
	PaddleDireita  Paddle
	Placar         Placar
	Vencedor       Lado
}

// NovoEstado cria uma partida nova: placar zerado, paddles centralizados
// e a bola sacando do centro.
func NovoEstado() *Estado {
	meio := (CampoAltura - AlturaPaddlePadrao) / 2
	return &Estado{
		Bola:           novaBola(),
		PaddleEsquerda: Paddle{Y: meio},
		PaddleDireita:  Paddle{Y: meio},
	}
}
