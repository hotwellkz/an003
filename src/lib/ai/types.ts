export interface AIResponse {
  response: string;
  error?: string;
  timestamp?: number;
}

export interface TextToSpeechRequest {
  text: string;
}

export interface ChatRequest {
  message: string;
  context?: string;
}