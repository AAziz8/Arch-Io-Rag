export interface ContextItem {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface GenerationConfig {
  thinkingBudget: number; // 0 for fast, >0 for deep reasoning
  useContext: boolean;
}

export type LoadingState = 'idle' | 'streaming' | 'error';
