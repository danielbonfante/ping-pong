package room

// Jogador é o contrato mínimo que o pacote room precisa de uma conexão
// para gerenciar salas, sem depender do transporte (WebSocket) usado.
type Jogador interface {
	Enviar(mensagem []byte)
	Nome() string
}
