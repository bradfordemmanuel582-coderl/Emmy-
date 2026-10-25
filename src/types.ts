export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 string
  size?: number;
  previewUrl?: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: Array<{
    data: string;
    mimeType: string;
    name?: string;
  }>;
  grounding?: GroundingMetadata;
  rating?: 'like' | 'dislike';
  error?: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  pinned?: boolean;
  systemPersonaId?: string;
  enableSearch?: boolean;
  temperature?: number;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'area' | 'pie' | 'donut';
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  labels: string[];
  datasets: ChartDataset[];
  summary?: string;
}
