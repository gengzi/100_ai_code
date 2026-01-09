export interface NostalgiaPerson {
  id: number;
  name: string;
  description?: string;
  relationship?: string;
  photoUrl?: string;
  voiceUrl?: string;
  personality?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonRequest {
  name: string;
  description?: string;
  relationship?: string;
  personality?: string;
}

export interface ChatRequest {
  personId: number;
  message: string;
}

export interface ChatResponse {
  response: string;
  conversationId: number;
}
