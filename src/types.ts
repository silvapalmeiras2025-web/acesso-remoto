export interface Device {
  id: string;
  nome: string;
  ultimo_acesso: string;
  status: 'online' | 'offline';
}

export interface Session {
  id: number;
  dispositivo_origem: string;
  dispositivo_destino: string;
  inicio: string;
  fim?: string;
  ip_origem: string;
}

export interface Transfer {
  id: number;
  sessao_id: number;
  nome_arquivo: string;
  tamanho: number;
  status: 'pending' | 'completed' | 'failed';
  data_envio: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}
