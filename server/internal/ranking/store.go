// Package ranking persiste os resultados de partidas online — o
// equivalente, no servidor, ao localStorage usado pelo ranking dos
// modos bot/local no cliente (web/lib/ranking.ts). Só resultados de
// partidas online completas (vitória por 5 pontos) são registrados;
// abandonos/desconexões não geram entrada, por simplicidade nesta fase.
package ranking

import (
	"database/sql"
	"time"

	_ "modernc.org/sqlite"
)

// Resultado é uma partida registrada, do ponto de vista de um jogador.
type Resultado struct {
	Nome         string
	GolsFeitos   int
	GolsSofridos int
	CriadoEm     time.Time
}

type Store struct {
	db *sql.DB
}

// Abrir cria (se preciso) o arquivo SQLite em `caminho` e garante a
// tabela de resultados.
func Abrir(caminho string) (*Store, error) {
	db, err := sql.Open("sqlite", caminho)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}

	const criarTabela = `
		CREATE TABLE IF NOT EXISTS resultados (
			id            INTEGER PRIMARY KEY AUTOINCREMENT,
			nome          TEXT NOT NULL,
			gols_feitos   INTEGER NOT NULL,
			gols_sofridos INTEGER NOT NULL,
			criado_em     INTEGER NOT NULL
		)`
	if _, err := db.Exec(criarTabela); err != nil {
		db.Close()
		return nil, err
	}

	return &Store{db: db}, nil
}

func (s *Store) Fechar() error {
	return s.db.Close()
}

// RegistrarResultado grava uma partida concluída para um jogador.
func (s *Store) RegistrarResultado(nome string, golsFeitos, golsSofridos int) error {
	const inserir = `
		INSERT INTO resultados (nome, gols_feitos, gols_sofridos, criado_em)
		VALUES (?, ?, ?, ?)`
	_, err := s.db.Exec(inserir, nome, golsFeitos, golsSofridos, time.Now().UnixMilli())
	return err
}

// Top5 retorna as cinco melhores partidas — mesmo critério de ordenação
// do ranking local: mais gols feitos, depois menos gols sofridos,
// depois mais recente.
func (s *Store) Top5() ([]Resultado, error) {
	const consulta = `
		SELECT nome, gols_feitos, gols_sofridos, criado_em
		FROM resultados
		ORDER BY gols_feitos DESC, gols_sofridos ASC, criado_em DESC
		LIMIT 5`

	linhas, err := s.db.Query(consulta)
	if err != nil {
		return nil, err
	}
	defer linhas.Close()

	resultados := []Resultado{}
	for linhas.Next() {
		var r Resultado
		var criadoEmMs int64
		if err := linhas.Scan(&r.Nome, &r.GolsFeitos, &r.GolsSofridos, &criadoEmMs); err != nil {
			return nil, err
		}
		r.CriadoEm = time.UnixMilli(criadoEmMs)
		resultados = append(resultados, r)
	}
	return resultados, linhas.Err()
}
