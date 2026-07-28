package ws

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	tempoEscritaMax    = 10 * time.Second
	tempoPong          = 60 * time.Second
	periodoPing        = (tempoPong * 9) / 10
	tamanhoMaxMensagem = 4096
)

// Cliente representa uma conexão WebSocket de um jogador. Implementa
// room.Jogador para que o Hub possa enviar mensagens sem conhecer o
// transporte usado.
type Cliente struct {
	conn *websocket.Conn
	send chan []byte
	nome string

	// código da sala que este cliente ocupa; preenchido após create/join
	// e usado para avisar o Hub em caso de desconexão.
	codigoSala string
}

func NovoCliente(conn *websocket.Conn) *Cliente {
	return &Cliente{
		conn: conn,
		send: make(chan []byte, 8),
	}
}

func (c *Cliente) Nome() string { return c.nome }

// Enviar entrega uma mensagem já serializada ao canal de escrita. Não
// bloqueia: se o canal estiver cheio, a mensagem é descartada (conexão
// provavelmente já está morta e será fechada pelo pump de leitura).
func (c *Cliente) Enviar(mensagem []byte) {
	select {
	case c.send <- mensagem:
	default:
		log.Printf("descartando mensagem: canal de envio cheio para %q", c.nome)
	}
}

// escreverPump entrega mensagens do canal de envio ao socket e mantém o
// keepalive via ping/pong. Deve rodar em sua própria goroutine.
func (c *Cliente) escreverPump() {
	ticker := time.NewTicker(periodoPing)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case mensagem, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(tempoEscritaMax))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, mensagem); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(tempoEscritaMax))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// lerPump lê mensagens do socket e as repassa para `processar`. Roda de
// forma bloqueante na goroutine do handler HTTP até a conexão cair.
func (c *Cliente) lerPump(processar func(dados []byte)) {
	defer c.conn.Close()

	c.conn.SetReadLimit(tamanhoMaxMensagem)
	c.conn.SetReadDeadline(time.Now().Add(tempoPong))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(tempoPong))
		return nil
	})

	for {
		_, dados, err := c.conn.ReadMessage()
		if err != nil {
			return
		}
		processar(dados)
	}
}
