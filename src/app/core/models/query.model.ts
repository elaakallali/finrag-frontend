export interface QuerySource {
  fileName: string;
  // null quand la page n'a pas pu être résolue pour ce chunk (titre de section non retrouvé
  // dans le découpage par page côté backend).
  page: number | null;
  score: number;
}

// Forme renvoyée par POST /api/report/query. "answer" est pour l'instant une réponse
// extractive (pas de LLM) ; le contrat restera identique quand la génération sera branchée.
export interface QueryResponse {
  answer: string;
  sources: QuerySource[];
}
