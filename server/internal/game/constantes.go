package game

// Dimensões e regras espaciais — idênticas às do cliente
// (web/components/game/constantesFisica.ts), não dependem da taxa de tick.
const (
	GapX               = 15.0
	LarguraPaddle      = 15.0
	AlturaPaddlePadrao = 200.0
	RaioBola           = 20.0
	ZonaPotenciaRatio  = 0.3
	PontosParaVencer   = 5

	// Campo lógico fixo simulado pelo servidor — o cliente escala/faz
	// letterbox no canvas para caber nele, em vez do servidor tentar
	// acompanhar o tamanho de janela de cada jogador.
	CampoLargura = 1280.0
	CampoAltura  = 720.0

	TaxaTick = 30 // Hz
)

// Velocidades — no cliente são expressas em pixels por quadro a ~60fps;
// aqui em pixels por tick a 30Hz, então valem o dobro para manter a
// mesma velocidade em pixels/segundo (mesma sensação de jogo).
const (
	VelocidadeMinima = 8.0
	DeltaVelocidade  = 0.8
	VelocidadePaddle = 14.0
)

// DirecoesReset replica os 5 ângulos fixos de saque do cliente.
var DirecoesReset = []float64{-0.7, -0.35, 0, 0.35, 0.7}
