package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"pingpong/server/internal/ranking"
	"pingpong/server/internal/room"
	"pingpong/server/internal/ws"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("RANKING_DB_PATH")
	if dbPath == "" {
		dbPath = "ranking.db"
	}
	rankingStore, err := ranking.Abrir(dbPath)
	if err != nil {
		log.Fatalf("erro ao abrir o banco de ranking (%s): %v", dbPath, err)
	}
	defer rankingStore.Fechar()

	hub := room.NovoHub(rankingStore)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handleHealth)
	mux.HandleFunc("GET /ws", ws.Handler(hub))
	mux.HandleFunc("GET /api/ranking", handleRanking(rankingStore))

	log.Printf("server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// resultadoRanking espelha o formato que web/lib/ranking.ts espera
// (mesma forma usada pelo ranking local em localStorage).
type resultadoRanking struct {
	Nome         string `json:"nome"`
	GolsFeitos   int    `json:"golsFeitos"`
	GolsSofridos int    `json:"golsSofridos"`
	CriadoEm     int64  `json:"criadoEm"`
}

func handleRanking(store *ranking.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Front-end roda em outra origem (Next.js dev server) — libera
		// CORS para este endpoint só-leitura.
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		resultados, err := store.Top5()
		if err != nil {
			log.Printf("erro ao consultar ranking: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "falha ao consultar ranking"})
			return
		}

		saida := make([]resultadoRanking, len(resultados))
		for i, r := range resultados {
			saida[i] = resultadoRanking{
				Nome:         r.Nome,
				GolsFeitos:   r.GolsFeitos,
				GolsSofridos: r.GolsSofridos,
				CriadoEm:     r.CriadoEm.UnixMilli(),
			}
		}
		json.NewEncoder(w).Encode(saida)
	}
}
