// Package protocol define o formato das mensagens trocadas pelo WebSocket
// entre o cliente Next.js e o servidor Go. É a implementação em Go do
// contrato descrito em shared/protocol.md.
package protocol

// MensagemCliente cobre todas as mensagens que o cliente pode enviar.
// Campos não usados por um tipo específico ficam vazios.
type MensagemCliente struct {
	Type       string `json:"type"`
	Code       string `json:"code,omitempty"`
	PlayerName string `json:"playerName,omitempty"`
	Direction  string `json:"direction,omitempty"`
}

const (
	TipoCriarSala   = "create_room"
	TipoEntrarSala  = "join_room"
	TipoSair        = "leave"
	TipoPaddleInput = "paddle_input"
)

// SalaCriada é enviada ao anfitrião com o código para compartilhar.
type SalaCriada struct {
	Type string `json:"type"`
	Code string `json:"code"`
}

func NovaSalaCriada(code string) SalaCriada {
	return SalaCriada{Type: "room_created", Code: code}
}

// Entrou confirma ao convidado que ele entrou na sala.
type Entrou struct {
	Type         string `json:"type"`
	Code         string `json:"code"`
	OpponentName string `json:"opponentName"`
}

func NovoEntrou(code, opponentName string) Entrou {
	return Entrou{Type: "joined", Code: code, OpponentName: opponentName}
}

// OponenteEntrou avisa o anfitrião que o segundo jogador chegou.
type OponenteEntrou struct {
	Type         string `json:"type"`
	OpponentName string `json:"opponentName"`
}

func NovoOponenteEntrou(opponentName string) OponenteEntrou {
	return OponenteEntrou{Type: "opponent_joined", OpponentName: opponentName}
}

// OponenteDesconectou avisa o jogador restante que o outro lado caiu.
type OponenteDesconectou struct {
	Type string `json:"type"`
}

func NovoOponenteDesconectou() OponenteDesconectou {
	return OponenteDesconectou{Type: "opponent_disconnected"}
}

// Erro comunica falhas de protocolo (sala inexistente, sala cheia, etc).
type Erro struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

func NovoErro(mensagem string) Erro {
	return Erro{Type: "error", Message: mensagem}
}

// CampoTamanho descreve as dimensões do campo lógico fixo simulado pelo
// servidor, para o cliente escalar o canvas.
type CampoTamanho struct {
	W float64 `json:"w"`
	H float64 `json:"h"`
}

// PartidaIniciada avisa cada cliente que a simulação começou e qual
// lado ele controla.
type PartidaIniciada struct {
	Type  string       `json:"type"`
	You   string       `json:"you"`
	Field CampoTamanho `json:"field"`
}

func NovaPartidaIniciada(lado string, largura, altura float64) PartidaIniciada {
	return PartidaIniciada{Type: "match_start", You: lado, Field: CampoTamanho{W: largura, H: altura}}
}

type posicaoXY struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type posicoesPaddle struct {
	Left  float64 `json:"left"`
	Right float64 `json:"right"`
}

// PlacarLados é o placar nos termos do protocolo (left/right).
type PlacarLados struct {
	Left  int `json:"left"`
	Right int `json:"right"`
}

// EstadoPartida é o snapshot autoritativo transmitido a cada tick.
type EstadoPartida struct {
	Type    string         `json:"type"`
	Tick    int            `json:"tick"`
	Ball    posicaoXY      `json:"ball"`
	Paddles posicoesPaddle `json:"paddles"`
	Score   PlacarLados    `json:"score"`
}

func NovoEstadoPartida(tick int, bolaX, bolaY, paddleEsquerda, paddleDireita float64, placarEsquerda, placarDireita int) EstadoPartida {
	return EstadoPartida{
		Type:    "state",
		Tick:    tick,
		Ball:    posicaoXY{X: bolaX, Y: bolaY},
		Paddles: posicoesPaddle{Left: paddleEsquerda, Right: paddleDireita},
		Score:   PlacarLados{Left: placarEsquerda, Right: placarDireita},
	}
}

// PartidaEncerrada avisa o fim da partida e quem venceu.
type PartidaEncerrada struct {
	Type   string      `json:"type"`
	Winner string      `json:"winner"`
	Score  PlacarLados `json:"score"`
}

func NovaPartidaEncerrada(vencedor string, placarEsquerda, placarDireita int) PartidaEncerrada {
	return PartidaEncerrada{
		Type:   "match_end",
		Winner: vencedor,
		Score:  PlacarLados{Left: placarEsquerda, Right: placarDireita},
	}
}
