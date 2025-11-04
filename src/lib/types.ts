export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
}

export interface QuoteRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: ServiceType;
  description: string;
  location: string;
  urgency: 'baixa' | 'media' | 'alta';
  budget: string;
  images?: string[];
  status: 'pendente' | 'em_analise' | 'respondido' | 'finalizado';
  createdAt: Date;
}

export type ServiceType = 
  | 'remodelacao'
  | 'construcao_civil'
  | 'pintura'
  | 'canalizacao'
  | 'betao'
  | 'construcao_raiz';

export interface Franchise {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  services: ServiceType[];
  location: string;
  status: 'ativo' | 'inativo' | 'pendente';
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  franchiseId: string;
  franchiseName: string;
  message: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalClients: number;
  activeQuotes: number;
  completedQuotes: number;
  totalFranchises: number;
  monthlyGrowth: number;
}