package game

import (
	"math"
	"math/rand/v2"
)

func novaBola() Bola {
	direcaoX := -1.0
	if rand.Float64() > 0.5 {
		direcaoX = 1
	}
	return Bola{
		X:          CampoLargura / 2,
		Y:          CampoAltura / 2,
		Velocidade: VelocidadeMinima,
		Direcao: Direcao{
			X: direcaoX,
			Y: DirecoesReset[rand.IntN(len(DirecoesReset))],
		},
	}
}

func clamp(valor, minimo, maximo float64) float64 {
	if valor < minimo {
		return minimo
	}
	if valor > maximo {
		return maximo
	}
	return valor
}

func moverPaddle(p *Paddle) {
	delta := 0.0
	switch p.Entrada {
	case EntradaCima:
		delta = -VelocidadePaddle
	case EntradaBaixo:
		delta = VelocidadePaddle
	}
	p.Y = clamp(p.Y+delta, 0, CampoAltura-AlturaPaddlePadrao)
}

func acertouZonaPotencia(bola *Bola, paddleY float64) bool {
	centroY := paddleY + AlturaPaddlePadrao/2
	meiaZona := (AlturaPaddlePadrao * ZonaPotenciaRatio) / 2
	return math.Abs(bola.Y-centroY) <= meiaZona
}

// variarRota define a inclinação do próximo trajeto, incluindo trajetos
// retos — mesma fórmula do cliente (simulacao.ts).
func variarRota(bola *Bola, paddleY float64) {
	centroRaquete := paddleY + AlturaPaddlePadrao/2
	impactoNormalizado := (bola.Y - centroRaquete) / (AlturaPaddlePadrao / 2)
	aleatoriedade := (rand.Float64() - 0.5) * 0.5
	direcaoY := clamp(impactoNormalizado*0.8+aleatoriedade, -0.9, 0.9)
	if rand.Float64() < 0.25 || math.Abs(direcaoY) < 0.14 {
		direcaoY = 0
	}
	bola.Direcao.Y = direcaoY
}

func rebater(estado *Estado, lado Lado) {
	bola := &estado.Bola
	var paddleY float64
	if lado == LadoDireita {
		bola.Direcao.X = -1
		paddleY = estado.PaddleDireita.Y
	} else {
		bola.Direcao.X = 1
		paddleY = estado.PaddleEsquerda.Y
	}

	if acertouZonaPotencia(bola, paddleY) {
		bola.Velocidade += DeltaVelocidade
	} else if bola.Velocidade > VelocidadeMinima {
		bola.Velocidade = math.Max(VelocidadeMinima, bola.Velocidade-DeltaVelocidade)
	} else {
		bola.Velocidade = VelocidadeMinima
	}

	variarRota(bola, paddleY)

	if lado == LadoDireita {
		bola.X = CampoLargura - RaioBola - LarguraPaddle - GapX - 1
	} else {
		bola.X = RaioBola + LarguraPaddle + GapX + 1
	}
}

func atingiuPaddle(bola *Bola, paddleY float64) bool {
	return bola.Y+RaioBola > paddleY && bola.Y-RaioBola < paddleY+AlturaPaddlePadrao
}

func pontoMarcado(estado *Estado, ladoVencedorDoPonto Lado) {
	if ladoVencedorDoPonto == LadoEsquerda {
		estado.Placar.Esquerda++
	} else {
		estado.Placar.Direita++
	}

	if estado.Placar.Esquerda >= PontosParaVencer {
		estado.Vencedor = LadoEsquerda
	} else if estado.Placar.Direita >= PontosParaVencer {
		estado.Vencedor = LadoDireita
	} else {
		estado.Bola = novaBola()
	}
}

// verificarColisoes checa paredes e paddles; retorna true quando um
// ponto foi marcado nesse passo.
func verificarColisoes(estado *Estado) bool {
	bola := &estado.Bola

	if bola.Direcao.X > 0 && bola.X > CampoLargura-RaioBola-LarguraPaddle-GapX {
		if atingiuPaddle(bola, estado.PaddleDireita.Y) {
			rebater(estado, LadoDireita)
		} else {
			pontoMarcado(estado, LadoEsquerda)
			return true
		}
	}

	if bola.Direcao.X < 0 && bola.X < RaioBola+LarguraPaddle+GapX {
		if atingiuPaddle(bola, estado.PaddleEsquerda.Y) {
			rebater(estado, LadoEsquerda)
		} else {
			pontoMarcado(estado, LadoDireita)
			return true
		}
	}

	tocouTopo := bola.Y-RaioBola < 0 && bola.Direcao.Y < 0
	tocouFundo := bola.Y > CampoAltura-RaioBola && bola.Direcao.Y > 0
	if tocouTopo || tocouFundo {
		bola.Direcao.Y *= -1
	}
	return false
}

func atualizarBola(estado *Estado) {
	if verificarColisoes(estado) {
		return
	}
	estado.Bola.X += estado.Bola.Direcao.X * estado.Bola.Velocidade
	estado.Bola.Y += estado.Bola.Direcao.Y * estado.Bola.Velocidade
}

// AvancarSimulacao avança um tick: move os dois paddles a partir da
// última entrada conhecida, então a bola. Não faz nada se a partida já
// tiver um vencedor.
func AvancarSimulacao(estado *Estado) {
	if estado.Vencedor != SemVencedor {
		return
	}
	estado.Tick++
	moverPaddle(&estado.PaddleEsquerda)
	moverPaddle(&estado.PaddleDireita)
	atualizarBola(estado)
}
