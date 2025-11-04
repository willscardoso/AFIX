'use client';

import { useState } from 'react';
import { Building2, Users, MessageSquare, BarChart3, Settings, Menu, X, Globe, Phone, Mail, MapPin, Star, ArrowRight, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { SERVICES, URGENCY_LEVELS, BUDGET_RANGES, COMPANY_INFO } from '@/lib/constants';
import { ServiceType, QuoteRequest } from '@/lib/types';

export default function Home() {
  const { language, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'home' | 'quote' | 'franchise' | 'dashboard' | 'chat'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '' as ServiceType | '',
    description: '',
    location: '',
    urgency: 'media' as 'baixa' | 'media' | 'alta',
    budget: ''
  });

  const t = {
    pt: {
      nav: {
        home: 'Início',
        quote: 'Pedir Orçamento',
        franchise: 'Franquia',
        dashboard: 'Dashboard',
        chat: 'Rede Franquiados'
      },
      hero: {
        title: 'Transforme o seu espaço com os melhores profissionais',
        subtitle: 'Conectamos você aos especialistas em remodelação, construção civil, pintura, canalização e betão. Qualidade garantida pelo Grupo AF.',
        cta: 'Pedir Orçamento Grátis',
        stats: {
          clients: 'Clientes Satisfeitos',
          projects: 'Projetos Concluídos',
          professionals: 'Profissionais Certificados'
        }
      },
      services: {
        title: 'Nossos Serviços',
        subtitle: 'Especialistas em todas as áreas da construção e remodelação'
      },
      quote: {
        title: 'Solicitar Orçamento',
        subtitle: 'Preencha o formulário e receba propostas dos melhores profissionais',
        form: {
          name: 'Nome completo',
          email: 'Email',
          phone: 'Telefone',
          service: 'Tipo de serviço',
          description: 'Descrição do projeto',
          location: 'Localização',
          urgency: 'Urgência',
          budget: 'Orçamento estimado',
          submit: 'Enviar Pedido'
        }
      },
      franchise: {
        title: 'Torne-se um Franquiado AFIX',
        subtitle: 'Junte-se à nossa rede de profissionais certificados',
        cost: 'Investimento: €2.000',
        benefits: [
          'Acesso exclusivo a pedidos de orçamento',
          'Rede de networking com outros profissionais',
          'Suporte técnico e comercial',
          'Certificação de qualidade Grupo AF'
        ],
        cta: 'Candidatar-se (Em breve)',
        network: {
          title: 'Rede de Franquiados',
          subtitle: 'Conecte-se com outros profissionais da rede AFIX'
        }
      },
      dashboard: {
        title: 'Dashboard Administrativo',
        stats: {
          clients: 'Total de Clientes',
          quotes: 'Orçamentos Ativos',
          completed: 'Projetos Finalizados',
          growth: 'Crescimento Mensal'
        }
      }
    },
    en: {
      nav: {
        home: 'Home',
        quote: 'Request Quote',
        franchise: 'Franchise',
        dashboard: 'Dashboard',
        chat: 'Franchise Network'
      },
      hero: {
        title: 'Transform your space with the best professionals',
        subtitle: 'We connect you to specialists in renovation, civil construction, painting, plumbing and concrete. Quality guaranteed by Grupo AF.',
        cta: 'Request Free Quote',
        stats: {
          clients: 'Satisfied Clients',
          projects: 'Completed Projects',
          professionals: 'Certified Professionals'
        }
      },
      services: {
        title: 'Our Services',
        subtitle: 'Specialists in all areas of construction and renovation'
      },
      quote: {
        title: 'Request Quote',
        subtitle: 'Fill out the form and receive proposals from the best professionals',
        form: {
          name: 'Full name',
          email: 'Email',
          phone: 'Phone',
          service: 'Service type',
          description: 'Project description',
          location: 'Location',
          urgency: 'Urgency',
          budget: 'Estimated budget',
          submit: 'Send Request'
        }
      },
      franchise: {
        title: 'Become an AFIX Franchisee',
        subtitle: 'Join our network of certified professionals',
        cost: 'Investment: €2,000',
        benefits: [
          'Exclusive access to quote requests',
          'Networking with other professionals',
          'Technical and commercial support',
          'Grupo AF quality certification'
        ],
        cta: 'Apply (Coming Soon)',
        network: {
          title: 'Franchise Network',
          subtitle: 'Connect with other AFIX network professionals'
        }
      },
      dashboard: {
        title: 'Administrative Dashboard',
        stats: {
          clients: 'Total Clients',
          quotes: 'Active Quotes',
          completed: 'Completed Projects',
          growth: 'Monthly Growth'
        }
      }
    }
  };

  const currentLang = t[language];

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui seria enviado para o backend e email
    alert(language === 'pt' ? 'Orçamento enviado com sucesso!' : 'Quote sent successfully!');
    setQuoteForm({
      name: '',
      email: '',
      phone: '',
      service: '',
      description: '',
      location: '',
      urgency: 'media',
      budget: ''
    });
  };

  const Navigation = () => (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">AFIX</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {Object.entries(currentLang.nav).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={toggleLanguage}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              <Globe className="h-4 w-4 mr-1" />
              {language.toUpperCase()}
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {Object.entries(currentLang.nav).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key as any);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  activeTab === key
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={toggleLanguage}
              className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            >
              <Globe className="h-4 w-4 mr-2" />
              {language.toUpperCase()}
            </button>
          </div>
        </div>
      )}
    </nav>
  );

  const HomePage = () => (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {currentLang.hero.title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              {currentLang.hero.subtitle}
            </p>
            <button
              onClick={() => setActiveTab('quote')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              {currentLang.hero.cta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold">500+</div>
              <div className="text-blue-200">{currentLang.hero.stats.clients}</div>
            </div>
            <div>
              <div className="text-4xl font-bold">1000+</div>
              <div className="text-blue-200">{currentLang.hero.stats.projects}</div>
            </div>
            <div>
              <div className="text-4xl font-bold">50+</div>
              <div className="text-blue-200">{currentLang.hero.stats.professionals}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {currentLang.services.title}
            </h2>
            <p className="text-xl text-gray-600">
              {currentLang.services.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(SERVICES).map(([key, service]) => (
              <div key={key} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {language === 'pt' ? service.name : service.nameEn}
                </h3>
                <p className="text-gray-600">
                  {language === 'pt' ? service.description : service.descriptionEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {language === 'pt' ? 'Pronto para começar o seu projeto?' : 'Ready to start your project?'}
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            {language === 'pt' 
              ? 'Receba orçamentos gratuitos dos melhores profissionais da sua região'
              : 'Get free quotes from the best professionals in your area'
            }
          </p>
          <button
            onClick={() => setActiveTab('quote')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            {currentLang.hero.cta}
          </button>
        </div>
      </section>
    </div>
  );

  const QuotePage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {currentLang.quote.title}
          </h1>
          <p className="text-xl text-gray-600">
            {currentLang.quote.subtitle}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleQuoteSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang.quote.form.name} *
                </label>
                <input
                  type="text"
                  required
                  value={quoteForm.name}
                  onChange={(e) => setQuoteForm({...quoteForm, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang.quote.form.email} *
                </label>
                <input
                  type="email"
                  required
                  value={quoteForm.email}
                  onChange={(e) => setQuoteForm({...quoteForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang.quote.form.phone} *
                </label>
                <input
                  type="tel"
                  required
                  value={quoteForm.phone}
                  onChange={(e) => setQuoteForm({...quoteForm, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang.quote.form.service} *
                </label>
                <select
                  required
                  value={quoteForm.service}
                  onChange={(e) => setQuoteForm({...quoteForm, service: e.target.value as ServiceType})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um serviço</option>
                  {Object.entries(SERVICES).map(([key, service]) => (
                    <option key={key} value={key}>
                      {language === 'pt' ? service.name : service.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLang.quote.form.location} *
              </label>
              <input
                type="text"
                required
                value={quoteForm.location}
                onChange={(e) => setQuoteForm({...quoteForm, location: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={language === 'pt' ? 'Cidade, Distrito' : 'City, District'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLang.quote.form.description} *
              </label>
              <textarea
                required
                rows={4}
                value={quoteForm.description}
                onChange={(e) => setQuoteForm({...quoteForm, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={language === 'pt' ? 'Descreva detalhadamente o seu projeto...' : 'Describe your project in detail...'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang.quote.form.urgency}
                </label>
                <select
                  value={quoteForm.urgency}
                  onChange={(e) => setQuoteForm({...quoteForm, urgency: e.target.value as any})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(URGENCY_LEVELS).map(([key, level]) => (
                    <option key={key} value={key}>
                      {language === 'pt' ? level.name : level.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang.quote.form.budget}
                </label>
                <select
                  value={quoteForm.budget}
                  onChange={(e) => setQuoteForm({...quoteForm, budget: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma faixa</option>
                  {BUDGET_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {language === 'pt' ? range.label : range.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {currentLang.quote.form.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const FranchisePage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {currentLang.franchise.title}
          </h1>
          <p className="text-xl text-gray-600">
            {currentLang.franchise.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-blue-600 mb-2">€2.000</div>
              <p className="text-gray-600">{currentLang.franchise.cost}</p>
            </div>

            <div className="space-y-4 mb-8">
              {currentLang.franchise.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            <button
              disabled
              className="w-full bg-gray-400 text-white py-4 px-6 rounded-lg text-lg font-semibold cursor-not-allowed"
            >
              {currentLang.franchise.cta}
            </button>
            <p className="text-sm text-gray-500 text-center mt-2">
              {language === 'pt' 
                ? 'Funcionalidade será ativada em breve'
                : 'Feature will be activated soon'
              }
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {currentLang.franchise.network.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentLang.franchise.network.subtitle}
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    JM
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900">João Martins</div>
                    <div className="text-sm text-gray-500">Construção Civil - Porto</div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">
                  {language === 'pt' 
                    ? 'Alguém tem experiência com projetos de remodelação em apartamentos antigos?'
                    : 'Does anyone have experience with renovation projects in old apartments?'
                  }
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    AS
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900">Ana Silva</div>
                    <div className="text-sm text-gray-500">Pintura - Lisboa</div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">
                  {language === 'pt' 
                    ? 'Acabei de finalizar um projeto incrível! Partilho algumas fotos no grupo.'
                    : 'Just finished an amazing project! Sharing some photos in the group.'
                  }
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-800 font-medium">
                {language === 'pt' 
                  ? 'Chat exclusivo para franquiados'
                  : 'Exclusive chat for franchisees'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardPage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentLang.dashboard.title}
          </h1>
          <p className="text-gray-600">
            {language === 'pt' 
              ? 'Visão geral da plataforma AFIX'
              : 'AFIX platform overview'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {currentLang.dashboard.stats.clients}
                </p>
                <p className="text-2xl font-bold text-gray-900">247</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {currentLang.dashboard.stats.quotes}
                </p>
                <p className="text-2xl font-bold text-gray-900">18</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {currentLang.dashboard.stats.completed}
                </p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {currentLang.dashboard.stats.growth}
                </p>
                <p className="text-2xl font-bold text-gray-900">+23%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'pt' ? 'Pedidos Recentes' : 'Recent Requests'}
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Maria Santos', service: 'Remodelação', location: 'Lisboa', status: 'pendente' },
                { name: 'Carlos Oliveira', service: 'Pintura', location: 'Porto', status: 'em_analise' },
                { name: 'Ana Costa', service: 'Canalização', location: 'Braga', status: 'respondido' }
              ].map((request, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{request.name}</p>
                    <p className="text-sm text-gray-600">{request.service} • {request.location}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    request.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'em_analise' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {request.status === 'pendente' ? (language === 'pt' ? 'Pendente' : 'Pending') :
                     request.status === 'em_analise' ? (language === 'pt' ? 'Em Análise' : 'In Analysis') :
                     (language === 'pt' ? 'Respondido' : 'Responded')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'pt' ? 'Serviços Mais Solicitados' : 'Most Requested Services'}
            </h3>
            <div className="space-y-4">
              {[
                { service: 'Remodelação', count: 45, percentage: 35 },
                { service: 'Pintura', count: 32, percentage: 25 },
                { service: 'Canalização', count: 28, percentage: 22 },
                { service: 'Construção Civil', count: 23, percentage: 18 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{item.service}</span>
                      <span className="text-sm text-gray-600">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ChatPage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentLang.franchise.network.title}
          </h1>
          <p className="text-gray-600">
            {currentLang.franchise.network.subtitle}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg h-96 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <MessageSquare className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-900">
                {language === 'pt' ? 'Chat Geral - Rede AFIX' : 'General Chat - AFIX Network'}
              </span>
              <span className="ml-auto text-sm text-gray-500">
                {language === 'pt' ? '12 membros online' : '12 members online'}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                JM
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="font-semibold text-gray-900">João Martins</span>
                  <span className="text-xs text-gray-500 ml-2">10:30</span>
                </div>
                <p className="text-gray-700">
                  {language === 'pt' 
                    ? 'Bom dia pessoal! Alguém tem experiência com isolamento térmico em casas antigas?'
                    : 'Good morning everyone! Does anyone have experience with thermal insulation in old houses?'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                AS
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="font-semibold text-gray-900">Ana Silva</span>
                  <span className="text-xs text-gray-500 ml-2">10:32</span>
                </div>
                <p className="text-gray-700">
                  {language === 'pt' 
                    ? 'Olá João! Sim, já fiz vários projetos. O importante é avaliar bem a estrutura primeiro.'
                    : 'Hi João! Yes, I\'ve done several projects. The important thing is to evaluate the structure first.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                RC
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="font-semibold text-gray-900">Rui Costa</span>
                  <span className="text-xs text-gray-500 ml-2">10:35</span>
                </div>
                <p className="text-gray-700">
                  {language === 'pt' 
                    ? 'Concordo com a Ana. Posso partilhar alguns materiais que uso. São muito eficazes!'
                    : 'I agree with Ana. I can share some materials I use. They are very effective!'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={language === 'pt' ? 'Digite sua mensagem...' : 'Type your message...'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              />
              <button
                disabled
                className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
              >
                {language === 'pt' ? 'Enviar' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {language === 'pt' 
                ? 'Chat disponível apenas para franquiados ativos'
                : 'Chat available only for active franchisees'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'quote':
        return <QuotePage />;
      case 'franchise':
        return <FranchisePage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'chat':
        return <ChatPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {renderContent()}
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-2xl font-bold">AFIX</span>
              </div>
              <p className="text-gray-300 mb-4">
                {language === 'pt' 
                  ? 'Conectamos você aos melhores profissionais de construção e remodelação. Qualidade garantida pelo Grupo AF.'
                  : 'We connect you to the best construction and renovation professionals. Quality guaranteed by Grupo AF.'
                }
              </p>
              <div className="flex space-x-4">
                <a href={`mailto:${COMPANY_INFO.email}`} className="text-gray-300 hover:text-white">
                  <Mail className="h-5 w-5" />
                </a>
                <a href={COMPANY_INFO.website} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {language === 'pt' ? 'Serviços' : 'Services'}
              </h3>
              <ul className="space-y-2">
                {Object.entries(SERVICES).slice(0, 3).map(([key, service]) => (
                  <li key={key}>
                    <span className="text-gray-300">
                      {language === 'pt' ? service.name : service.nameEn}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {language === 'pt' ? 'Contato' : 'Contact'}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">{COMPANY_INFO.email}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Globe className="h-4 w-4 mr-2" />
                  <span className="text-sm">{COMPANY_INFO.website}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 AFIX - {language === 'pt' ? 'Todos os direitos reservados' : 'All rights reserved'} | 
              {language === 'pt' ? ' Powered by ' : ' Powered by '}
              <a href={COMPANY_INFO.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                Grupo AF
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}