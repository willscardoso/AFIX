import { ServiceType } from './types';

export const SERVICES: Record<ServiceType, { name: string; nameEn: string; icon: string; description: string; descriptionEn: string }> = {
  remodelacao: {
    name: 'Remodelação',
    nameEn: 'Renovation',
    icon: '🏠',
    description: 'Transforme o seu espaço com remodelações completas',
    descriptionEn: 'Transform your space with complete renovations'
  },
  construcao_civil: {
    name: 'Construção Civil',
    nameEn: 'Civil Construction',
    icon: '🏗️',
    description: 'Projetos de construção civil de qualidade',
    descriptionEn: 'Quality civil construction projects'
  },
  pintura: {
    name: 'Pintura',
    nameEn: 'Painting',
    icon: '🎨',
    description: 'Serviços de pintura interior e exterior',
    descriptionEn: 'Interior and exterior painting services'
  },
  canalizacao: {
    name: 'Canalização',
    nameEn: 'Plumbing',
    icon: '🔧',
    description: 'Instalação e reparação de sistemas de canalização',
    descriptionEn: 'Installation and repair of plumbing systems'
  },
  betao: {
    name: 'Betão',
    nameEn: 'Concrete',
    icon: '🧱',
    description: 'Trabalhos especializados em betão',
    descriptionEn: 'Specialized concrete work'
  },
  construcao_raiz: {
    name: 'Construção Raiz',
    nameEn: 'Ground-up Construction',
    icon: '🏘️',
    description: 'Construção desde a fundação',
    descriptionEn: 'Construction from foundation up'
  }
};

export const URGENCY_LEVELS = {
  baixa: { name: 'Baixa', nameEn: 'Low', color: 'text-green-600' },
  media: { name: 'Média', nameEn: 'Medium', color: 'text-yellow-600' },
  alta: { name: 'Alta', nameEn: 'High', color: 'text-red-600' }
};

export const BUDGET_RANGES = [
  { value: 'ate_1000', label: 'Até €1.000', labelEn: 'Up to €1,000' },
  { value: '1000_5000', label: '€1.000 - €5.000', labelEn: '€1,000 - €5,000' },
  { value: '5000_15000', label: '€5.000 - €15.000', labelEn: '€5,000 - €15,000' },
  { value: '15000_50000', label: '€15.000 - €50.000', labelEn: '€15,000 - €50,000' },
  { value: 'acima_50000', label: 'Acima de €50.000', labelEn: 'Above €50,000' },
  { value: 'a_definir', label: 'A definir', labelEn: 'To be defined' }
];

export const COMPANY_INFO = {
  name: 'AFIX',
  tagline: 'Conectamos você aos melhores profissionais',
  taglineEn: 'Connecting you to the best professionals',
  email: 'info.aptidaoflorescente@gmail.com',
  website: 'http://grupoaf.pt',
  franchiseCost: 2000
};