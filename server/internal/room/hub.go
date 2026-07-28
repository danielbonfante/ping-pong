package room

import (
	"encoding/json"
	"errors"
	"log"
	"math/rand/v2"
	"sync"
	"time"

	"pingpong/server/internal/game"
	"pingpong/server/internal/protocol"
	"pingpong/server/internal/ranking"
)

var (
	ErrSalaNaoEncontrada = errors.New("sala não encontrada")
	ErrSalaCheia         = errors.New("sala já está cheia")
)

const (
	alfabetoCodigo    = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	tamanhoCodigo     = 4
	tempoLimiteEspera = 10 * time.Minute
)

// Hub guarda todas as salas ativas e serializa o acesso a elas com um
// mutex. Cada sala com dois jogadores tem sua própria goroutine de tick
// (veja partida.go) — o mutex aqui protege só o mapa de salas, não o
// loop de simulação em si.
type Hub struct {
	mu      sync.Mutex
	salas   map[string]*Sala
	ranking *ranking.Store
}

// NovoHub cria o Hub. `rankingStore` pode ser nil (ex.: em testes que
// não se importam com persistência).
func NovoHub(rankingStore *ranking.Store) *Hub {
	h := &Hub{salas: make(map[string]*Sala), ranking: rankingStore}
	go h.limparSalasAbandonadas()
	return h
}

func gerarCodigo() string {
	b := make([]byte, tamanhoCodigo)
	for i := range b {
		b[i] = alfabetoCodigo[rand.IntN(len(alfabetoCodigo))]
	}
	return string(b)
}

// CriarSala registra uma nova sala aguardando um segundo jogador e avisa
// o anfitrião com o código gerado.
func (h *Hub) CriarSala(anfitriao Jogador) *Sala {
	h.mu.Lock()
	var codigo string
	for {
		codigo = gerarCodigo()
		if _, existe := h.salas[codigo]; !existe {
			break
		}
	}

	sala := &Sala{
		Codigo:    codigo,
		Anfitriao: anfitriao,
		Estado:    EstadoAguardando,
		CriadaEm:  time.Now(),
	}
	h.salas[codigo] = sala
	h.mu.Unlock()

	enviar(anfitriao, protocol.NovaSalaCriada(codigo))
	return sala
}

// EntrarSala associa o convidado a uma sala existente e notifica os dois
// lados. Retorna erro se o código não existir ou a sala já estiver cheia.
func (h *Hub) EntrarSala(codigo string, convidado Jogador) error {
	h.mu.Lock()
	sala, existe := h.salas[codigo]
	if existe && sala.Estado == EstadoAguardando {
		sala.Convidado = convidado
		sala.Estado = EstadoAtiva
	}
	h.mu.Unlock()

	if !existe {
		enviar(convidado, protocol.NovoErro("sala não encontrada"))
		return ErrSalaNaoEncontrada
	}
	if sala.Convidado != convidado {
		enviar(convidado, protocol.NovoErro("sala já está cheia"))
		return ErrSalaCheia
	}

	enviar(convidado, protocol.NovoEntrou(codigo, sala.Anfitriao.Nome()))
	enviar(sala.Anfitriao, protocol.NovoOponenteEntrou(convidado.Nome()))

	sala.partida = iniciarPartida(sala.Anfitriao, sala.Convidado, h.ranking, func() {
		h.removerSala(codigo)
	})
	return nil
}

// removerSala tira a sala do mapa — chamado quando a partida termina
// naturalmente (vitória). Desconexões usam Sair, que já remove.
func (h *Hub) removerSala(codigo string) {
	h.mu.Lock()
	delete(h.salas, codigo)
	h.mu.Unlock()
}

// ReceberInput encaminha a direção informada por um jogador para a
// partida em andamento na sala. Sem efeito se a sala ou a partida ainda
// não existirem (ex.: mensagem chegou antes do segundo jogador entrar).
func (h *Hub) ReceberInput(codigo string, jogador Jogador, direcao string) {
	h.mu.Lock()
	sala, existe := h.salas[codigo]
	h.mu.Unlock()

	if !existe || sala.partida == nil {
		return
	}
	sala.partida.receberInput(jogador, game.EntradaDeString(direcao))
}

// Sair remove o jogador da sala informada e avisa o oponente restante,
// se houver. Encerra a sala em seguida (sem grace period nesta versão).
func (h *Hub) Sair(codigo string, jogador Jogador) {
	h.mu.Lock()
	sala, existe := h.salas[codigo]
	if !existe {
		h.mu.Unlock()
		return
	}

	var restante Jogador
	if jogador == sala.Anfitriao {
		restante = sala.Convidado
	} else if jogador == sala.Convidado {
		restante = sala.Anfitriao
	}
	delete(h.salas, codigo)
	h.mu.Unlock()

	if sala.partida != nil {
		sala.partida.encerrar()
	}
	if restante != nil {
		enviar(restante, protocol.NovoOponenteDesconectou())
	}
}

func enviar(j Jogador, mensagem any) {
	dados, err := json.Marshal(mensagem)
	if err != nil {
		log.Printf("erro ao serializar mensagem: %v", err)
		return
	}
	j.Enviar(dados)
}

// limparSalasAbandonadas remove salas que nunca chegaram a ter um
// segundo jogador — evita vazamento de memória com salas criadas e
// esquecidas.
func (h *Hub) limparSalasAbandonadas() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		h.mu.Lock()
		for codigo, sala := range h.salas {
			if sala.Estado == EstadoAguardando && time.Since(sala.CriadaEm) > tempoLimiteEspera {
				delete(h.salas, codigo)
			}
		}
		h.mu.Unlock()
	}
}
