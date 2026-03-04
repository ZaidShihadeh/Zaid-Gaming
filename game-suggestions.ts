export interface GameSuggestion {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  gameTitle: string;
  genre: string;
  description: string;
  whyImportant?: string;
  contactEmail: string;
  status: "pending" | "approved" | "rejected";
  adminMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGameSuggestionRequest {
  gameTitle: string;
  genre: string;
  description: string;
  whyImportant?: string;
  contactEmail: string;
}

export interface GameSuggestionResponse {
  success: boolean;
  message: string;
  suggestion?: GameSuggestion;
}

export interface GameSuggestionsListResponse {
  success: boolean;
  suggestions: GameSuggestion[];
}

export interface UpdateGameSuggestionRequest {
  id: string;
  status: "approved" | "rejected";
  adminMessage?: string;
}

export interface UserGameSuggestionsResponse {
  success: boolean;
  suggestions: GameSuggestion[];
}
