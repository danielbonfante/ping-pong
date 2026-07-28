package ws

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"

	"pingpong/server/internal/protocol"
	"pingpong/server/internal/room"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Projeto pessoal servido por um único front-end conhecido: sem
	// checagem de origem por enquanto. Revisitar antes de expor a mais
	// de um domínio.
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Handler faz o upgrade da conexão HTTP para WebSocket e liga o cliente
// resultante ao Hub de salas.
func Handler(hub *room.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("falha no upgrade websocket: %v", err)
			return
		}

		cliente := NovoCliente(conn)
		go cliente.escreverPump()

		cliente.lerPump(func(dados []byte) {
			processarMensagem(hub, cliente, dados)
		})

		if cliente.codigoSala != "" {
			hub.Sair(cliente.codigoSala, cliente)
		}
		close(cliente.send)
	}
}

func processarMensagem(hub *room.Hub, cliente *Cliente, dados []byte) {
	var msg protocol.MensagemCliente
	if err := json.Unmarshal(dados, &msg); err != nil {
		log.Printf("mensagem inválida: %v", err)
		return
	}

	switch msg.Type {
	case protocol.TipoCriarSala:
		cliente.nome = msg.PlayerName
		sala := hub.CriarSala(cliente)
		cliente.codigoSala = sala.Codigo
	case protocol.TipoEntrarSala:
		cliente.nome = msg.PlayerName
		if err := hub.EntrarSala(msg.Code, cliente); err == nil {
			cliente.codigoSala = msg.Code
		}
	case protocol.TipoSair:
		if cliente.codigoSala != "" {
			hub.Sair(cliente.codigoSala, cliente)
			cliente.codigoSala = ""
		}
	case protocol.TipoPaddleInput:
		if cliente.codigoSala != "" {
			hub.ReceberInput(cliente.codigoSala, cliente, msg.Direction)
		}
	default:
		log.Printf("tipo de mensagem ainda não tratado: %s", msg.Type)
	}
}
