"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
// Login is a dedicated page at /login
import { Building2, Users, MessageSquare, BarChart3, Settings, Menu, X, Globe, Phone, Mail, MapPin, Star, ArrowRight, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { SERVICES, URGENCY_LEVELS, BUDGET_RANGES, COMPANY_INFO } from '@/lib/constants';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { ServiceType, QuoteRequest } from '@/lib/types';
import BancaPage from '@/app/banca/page'
import QuotePageComponent from '@/components/QuotePage'

function HomeContent() {
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'home' | 'quote' | 'franchise' | 'dashboard' | 'chat'>('home');
  // Avoid initial flicker: wait for auth check before rendering the main content
  const [authLoaded, setAuthLoaded] = useState(false);
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
  // Use refs for form controls to avoid controlled re-renders that steal focus
  const nameRef = useRef<HTMLInputElement | null>(null)
  const emailRef = useRef<HTMLInputElement | null>(null)
  const phoneRef = useRef<HTMLInputElement | null>(null)
  const serviceRef = useRef<HTMLSelectElement | null>(null)
  const locationRef = useRef<HTMLInputElement | null>(null)
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const urgencyRef = useRef<HTMLSelectElement | null>(null)
  const budgetRef = useRef<HTMLSelectElement | null>(null)

  const [currentUser, setCurrentUser] = useState<{ id?: string; email?: string; full_name?: string; role?: string; phone?: string; created_at?: string } | null>(null);
  const [projetos, setProjetos] = useState<any[]>([])
  const router = useRouter();

  useEffect(() => {
    // fetch current user (if any) to show their name on CTAs
    let mounted = true;
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!mounted) return
        if (data?.ok && data.user) {
          // normalize role to lowercase for consistent checks across the app
          const role = data.user.role ? String(data.user.role).toLowerCase() : undefined
          setCurrentUser({ id: data.user.id, email: data.user.email, full_name: data.user.full_name, role, phone: data.user.phone, created_at: data.user.created_at });
        } else {
          setCurrentUser(null)
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setAuthLoaded(true)
      }
    }
    loadUser()
    return () => { mounted = false };
  }, []);

  // Listen for global logout events (dispatched by other components) and update local state immediately
  useEffect(() => {
    const onLogout = () => {
      setCurrentUser(null)
      setActiveTab('home')
      setProjetos([])
    }
    try {
      window.addEventListener('afix:logout', onLogout as EventListener)
    } catch (e) {}
    return () => { try { window.removeEventListener('afix:logout', onLogout as EventListener) } catch (e) {} }
  }, [])

  // read `tab` query param to control which internal page is shown when on /
  const searchParams = useSearchParams()
  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab && ['home','quote','franchise','dashboard','chat'].includes(tab)) {
      setActiveTab(tab as any)
    }
  }, [searchParams])

  // After auth loads: if user is logged in and we haven't been directed via ?tab,
  // default to dashboard to avoid flashing the Home first.
  useEffect(() => {
    if (!authLoaded) return
    if (currentUser && activeTab === 'home' && !searchParams?.get('tab')) {
      setActiveTab('dashboard')
    }
  }, [authLoaded, currentUser])

  // load projetos for any authenticated user from the secure server-side endpoint
  useEffect(() => {
    let mounted = true
    async function loadProjetos() {
      if (!currentUser || !currentUser.email) return
      try {
        const res = await fetch('/api/me/projetos', { method: 'GET', credentials: 'same-origin' })
        const payload = await res.json()
        if (!mounted) return
        if (!res.ok || !payload.ok) {
          console.warn('Failed to load projetos via server endpoint', payload.error)
          return
        }
        setProjetos(payload.projetos || [])
      } catch (err) {
        // ignore
      }
    }
    // Defer project loading until auth fully resolved to avoid flashing empty state
    if (authLoaded) loadProjetos()
    return () => { mounted = false };
  }, [currentUser, authLoaded]);

  // listen for global refresh requests (e.g., after submitting a quote)
  useEffect(() => {
    const handler = () => {
      (async () => {
        try {
          const res = await fetch('/api/me/projetos', { method: 'GET', credentials: 'same-origin' })
          const payload = await res.json()
          if (payload?.ok) setProjetos(payload.projetos || [])
        } catch (e) {}
      })()
    }
    try { window.addEventListener('afix:refreshProjetos', handler as EventListener) } catch (_) {}
    return () => { try { window.removeEventListener('afix:refreshProjetos', handler as EventListener) } catch (_) {} }
  }, [])

  const t = {
    pt: {
      nav: {
        home: 'Início',
        quote: 'Pedir Orçamento',
        franchise: 'Franquia',
        dashboard: 'Projetos',
        chat: 'Rede Franquia'
      },
      hero: {
        title: 'Transforme o seu espaço com os melhores profissionais',
        subtitle: 'Conectamos-o com especialistas em remodelação, construção civil, pintura, canalização e betão. Qualidade garantida pelo Grupo AF.',
        cta: 'Pedir Orçamento Grátis',
        stats: {
          clients: 'Clientes Satisfeitos',
          projects: 'Projetos Concluídos',
          professionals: 'Profissionais Certificados'
        }
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
        },
        submit: 'Enviar Pedido'
      },
      services: {
        title: 'Os Nossos Serviços',
        subtitle: 'Especialistas em todas as áreas de construção e remodelação'
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
        dashboard: 'Projects',
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

  const currentLang = (t as any)[language] ?? t.pt;

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // send to server API to persist the quote
    ;(async () => {
      try {
        const payload = {
          name: nameRef.current?.value || '',
          email: emailRef.current?.value || '',
          phone: phoneRef.current?.value || '',
          service: serviceRef.current?.value || '',
          description: descriptionRef.current?.value || '',
          location: locationRef.current?.value || '',
          urgency: urgencyRef.current?.value || '',
          budget: budgetRef.current?.value || ''
        }

        const res = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to submit')
        // use toast instead of alert
        toast({ title: language === 'pt' ? 'Orçamento enviado' : 'Quote sent', description: language === 'pt' ? 'O seu pedido foi recebido.' : 'Your request has been received.' })
        // clear uncontrolled inputs
        if (nameRef.current) nameRef.current.value = ''
        if (emailRef.current) emailRef.current.value = ''
        if (phoneRef.current) phoneRef.current.value = ''
        if (serviceRef.current) serviceRef.current.value = ''
        if (descriptionRef.current) descriptionRef.current.value = ''
        if (locationRef.current) locationRef.current.value = ''
        if (urgencyRef.current) urgencyRef.current.value = 'media'
        if (budgetRef.current) budgetRef.current.value = ''
        setQuoteForm({ name: '', email: '', phone: '', service: '', description: '', location: '', urgency: 'media', budget: '' })
      } catch (err: any) {
        toast({ title: language === 'pt' ? 'Erro' : 'Error', description: err?.message ?? 'Erro ao enviar pedido' })
      }
    })()
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
  {(() => {
    const r = String(currentUser?.role || '').toLowerCase();
    // Admin: only show home + dashboard
    const entries = Object.entries(currentLang.nav as Record<string,string>).filter(([key]) => {
      if (r === 'admin') return ['home','dashboard'].includes(key);
      // Hide dashboard for cliente & franqueado (logic original)
      if ((r === 'cliente' || r === 'franqueado') && key === 'dashboard') return false;
      return true;
    });
    return entries.map(([key,label]) => (
      <button
        key={key}
        onClick={() => setActiveTab(key as any)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === key ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'
        }`}
      >
        {label}
      </button>
    ))
  })()}
            <button
              onClick={toggleLanguage}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              <Globe className="h-4 w-4 mr-1" />
              {language.toUpperCase()}
            </button>
            {/* Auth controls */}
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-gray-700">
                  <Users className="h-5 w-5 text-gray-600" />
                  <span
                    className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600"
                    title={language === 'pt' ? 'Ver conta' : 'View account'}
                    onClick={() => router.push('/account')}
                  >
                    {currentUser.full_name || currentUser.email}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST' })
                    } catch (e) {}
                    setCurrentUser(null)
                    setActiveTab('home')
                    try { window.dispatchEvent(new CustomEvent('afix:logout')) } catch (e) {}
                    router.push('/')
                  }}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => router.push('/login')} className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">Login</button>
            )}
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
            {(() => {
              const r = String(currentUser?.role || '').toLowerCase();
              const entries = Object.entries(currentLang.nav as Record<string,string>).filter(([key]) => {
                if (r === 'admin') return ['home','dashboard'].includes(key);
                if ((r === 'cliente' || r === 'franqueado') && key === 'dashboard') return false;
                return true;
              });
              return entries.map(([key,label]) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key as any); setMobileMenuOpen(false); }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    activeTab === key ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {label}
                </button>
              ))
            })()}
            <button
              onClick={toggleLanguage}
              className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            >
              <Globe className="h-4 w-4 mr-2" />
              {language.toUpperCase()}
            </button>
            <div className="px-3 py-2">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Users className="h-5 w-5 text-gray-600" />
                    <span
                      className="text-sm font-medium cursor-pointer hover:text-blue-600"
                      title={language === 'pt' ? 'Ver conta' : 'View account'}
                      onClick={() => { setMobileMenuOpen(false); router.push('/account') }}
                    >
                      {currentUser.full_name || currentUser.email}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                        try {
                          await fetch('/api/auth/logout', { method: 'POST' })
                        } catch (e) {}
                        setCurrentUser(null)
                        setMobileMenuOpen(false)
                        setActiveTab('home')
                        try { window.dispatchEvent(new CustomEvent('afix:logout')) } catch (e) {}
                        router.push('/')
                      }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
                  >Logout</button>
                </div>
              ) : (
                <button onClick={() => { setMobileMenuOpen(false); router.push('/login') }} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600">Login</button>
              )}
            </div>
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
            <div className="inline-flex">
              <button
                onClick={() => setActiveTab('quote')}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
              >
                {currentUser?.full_name ? `Pedir Orçamento — ${currentUser.full_name}` : 'Pedir Orçamento'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
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

  // use the standalone QuotePage component
  const QuotePage = () => <QuotePageComponent />

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
              {(currentLang.franchise.benefits as string[]).map((benefit: string, index: number) => (
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

  const ProjectsPage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`}> 
        {/* Single Client Info Card positioned ABOVE the Projects title */}
        {(() => {
          const _role = String(currentUser?.role || '').toLowerCase()
          const isClientLike = ['cliente', 'franqueado', 'franqueador'].includes(_role)
          if (isClientLike && Array.isArray(projetos) && projetos.length > 0) {
            const fp: any = projetos[0] || {}
            return (
              <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div>
                    {(() => {
                      const roleLower = String(currentUser?.role || '').toLowerCase()
                      const labelPt = roleLower === 'franqueador'
                        ? 'Franqueador'
                        : roleLower === 'franqueado'
                          ? 'Franqueado'
                          : 'Cliente'
                      const labelEn = roleLower === 'franqueador'
                        ? 'Franchisor'
                        : roleLower === 'franqueado'
                          ? 'Franchisee'
                          : 'Client'
                      return <div className="text-gray-500">{language === 'pt' ? labelPt : labelEn}</div>
                    })()}
                    <div className="font-medium text-gray-900">{currentUser?.full_name || fp.full_name || fp.nome || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Email</div>
                    <div className="text-gray-900">{currentUser?.email || fp.email || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{language === 'pt' ? 'Telemóvel' : 'Phone'}</div>
                    <div className="text-gray-900">{currentUser?.phone || fp.phone || fp.telemovel || fp.telefone || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{language === 'pt' ? 'Localização' : 'Location'}</div>
                    <div className="text-gray-900">{fp.location || fp.localizacao || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{language === 'pt' ? 'Conta criada' : 'Account created'}</div>
                    <div className="text-gray-900">{currentUser?.created_at ? new Date(currentUser.created_at).toLocaleString() : (fp.created_at ? new Date(fp.created_at).toLocaleString() : '—')}</div>
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}

        <div className="mb-6">
          {(() => {
            const roleLower = String(currentUser?.role || '').toLowerCase()
            if (roleLower === 'franqueado') {
              return (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{language === 'pt' ? 'Serviços' : 'Services'}</h1>
                  <p className="text-sm text-gray-600">{language === 'pt' ? 'Todos os serviços disponíveis dos projetos' : 'All available services from projects'}</p>
                </>
              )
            }
            return (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{language === 'pt' ? 'Projetos' : 'Projects'}</h1>
                <p className="text-sm text-gray-600">{language === 'pt' ? 'Lista de pedidos e projetos' : 'List of requests and projects'}</p>
              </>
            )
          })()}
        </div>

  {/* Wrapper removido: cada projeto terá agora seu próprio card independente; franqueado continua com cards por serviço */}
  <div>
          {(() => {
            const _role = String(currentUser?.role || '').toLowerCase()
            const isClientLike = ['cliente', 'franqueado', 'franqueador'].includes(_role)
            if (isClientLike) {
              if (projetos.length === 0) {
                return (
                  <p className="text-sm text-gray-600">{language === 'pt' ? 'Ainda não tem pedidos.' : 'You have no requests yet.'}</p>
                )
              }
              // Special aggregated services view ONLY for franqueado: show every service as independent card
              if (_role === 'franqueado') {
                const allServices = projetos.flatMap((p: any) => (Array.isArray(p.services) ? p.services.map((s: any) => ({ ...s, _project: p })) : []))
                if (!allServices.length) {
                  return <p className="text-sm text-gray-600">{language === 'pt' ? 'Sem serviços disponíveis.' : 'No services available.'}</p>
                }
                // sort newest first by service created_at if available else project created_at
                allServices.sort((a: any, b: any) => new Date(b.created_at || b._project?.created_at || 0).getTime() - new Date(a.created_at || a._project?.created_at || 0).getTime())
                return (
                  <div className="space-y-4">
                    {allServices.map((s: any, i: number) => {
                      const serviceLabel = (SERVICES as any)[s.service]?.name || s.service || `Serviço ${i + 1}`
                      const budgetLabel = BUDGET_RANGES.find((b: any) => b.value === s.budget)?.label || ''
                      const urgencyLabel = (URGENCY_LEVELS as any)[s.urgency]?.name || ''
                      const statusLabel = s.status === 'respondido' ? (language === 'pt' ? 'Respondido' : 'Answered') : s.status === 'pendente' ? (language === 'pt' ? 'Pendente' : 'Pending') : (s.status || '')
                      const proj = s._project || {}
                      return (
                        <div key={s.id || i} className="w-full border border-gray-200 rounded-md bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{serviceLabel}</div>
                              <div className="text-xs text-gray-500">{new Date(proj.created_at).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              {budgetLabel && <span className="px-2 py-0.5 rounded bg-gray-100">{budgetLabel}</span>}
                              {urgencyLabel && <span className="px-2 py-0.5 rounded bg-gray-100">{urgencyLabel}</span>}
                              {s.status && <span className={`px-2 py-0.5 rounded ${s.status === 'respondido' ? 'bg-blue-100 text-blue-800' : s.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{statusLabel}</span>}
                            </div>
                          </div>
                          {s.description ? <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">{s.description}</div> : null}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                            {s.created_at && <span>{language === 'pt' ? 'Criado' : 'Created'}: {new Date(s.created_at).toLocaleString()}</span>}
                            {s.responsavel_tecnico && <span>{language === 'pt' ? 'Franqueado Responsável' : 'Responsible Franchisee'}: {s.responsavel_tecnico}</span>}
                          </div>
                          {/* Angariar / Desistir (service-level) */}
                          <div className="mt-3 flex gap-2">
                            {(() => {
                              const myId = (currentUser?.full_name || currentUser?.email || '').trim()
                              const isMine = Boolean(s.responsavel_tecnico) && String(s.responsavel_tecnico).trim() === myId
                              if (s.status !== 'respondido') {
                                return (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/servicos/${s.id}/angariar`, { method: 'POST' })
                                        const data = await res.json()
                                        if (data.ok) {
                                          setProjetos(prev => prev.map(pr => pr.id === proj.id ? { ...pr, services: (pr.services || []).map((sv: any) => (sv.id === s.id ? { ...sv, status: 'respondido', responsavel_tecnico: (currentUser?.full_name || currentUser?.email || '') } : sv)) } : pr))
                                        } else {
                                          alert(data.error || 'Erro ao angariar serviço')
                                        }
                                      } catch (e:any) {
                                        alert('Erro ao angariar serviço')
                                      }
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                  >
                                    {language === 'pt' ? 'Angariar' : 'Claim'}
                                  </button>
                                )
                              }
                              // status == respondido: só o franqueado que angariou pode desistir; os outros não veem botões
                              if (isMine) {
                                return (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/servicos/${s.id}/desistir`, { method: 'POST' })
                                        const data = await res.json()
                                        if (data.ok) {
                                          setProjetos(prev => prev.map(pr => pr.id === proj.id ? { ...pr, services: (pr.services || []).map((sv: any) => (sv.id === s.id ? { ...sv, status: 'pendente', responsavel_tecnico: null } : sv)) } : pr))
                                        } else {
                                          alert(data.error || 'Erro ao desistir do serviço')
                                        }
                                      } catch (e:any) {
                                        alert('Erro ao desistir do serviço')
                                      }
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                                  >
                                    {language === 'pt' ? 'Desistir' : 'Unclaim'}
                                  </button>
                                )
                              }
                              return null
                            })()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }

              return (
                <div className="grid grid-cols-1 gap-6">
                  {projetos.map((p) => (
                    <div key={p.id} className="rounded-xl bg-white shadow-lg p-6 relative">
                      {(() => {
                        const roleLower = String(currentUser?.role || '').toLowerCase()
                        // franqueado now sees full card (details + services) like others

                        return (
                          <>
                            <div className="flex justify-between items-start">
                              <div className="pr-4">
                                {p.nome_projeto ? (
                                  <p className="font-semibold text-gray-900 text-sm mb-1">{p.nome_projeto}</p>
                                ) : null}
                                <p className="font-medium text-gray-700 text-xs">{p.full_name || 'Cliente'}</p>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const budgetLabel = BUDGET_RANGES.find((b:any) => b.value === p.budget)?.label || ''
                                    return budgetLabel ? (
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700" title={language==='pt'? 'Orçamento':'Budget'}>{budgetLabel}</span>
                                    ) : null
                                  })()}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : p.status === 'em_analise' ? 'bg-blue-100 text-blue-800' : p.status === 'finalizado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {p.status === 'pendente' ? (language === 'pt' ? 'Pendente' : 'Pending') : p.status === 'em_analise' ? (language === 'pt' ? 'Em Análise' : 'In Analysis') : p.status === 'finalizado' ? (language === 'pt' ? 'Finalizado' : 'Finished') : (language === 'pt' ? 'Respondido' : 'Responded')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-gray-500">{new Date(p.created_at).toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              {p.location ? <div><strong>Morada:</strong> {p.location}</div> : null}
                              {p.localizacao ? <div><strong>Localização:</strong> {p.localizacao}</div> : null}
                              {p.responsavel_tecnico ? <div><strong>Responsável Técnico:</strong> {p.responsavel_tecnico}</div> : null}
                              {p.data_inicio_prevista ? <div><strong>Início previsto:</strong> {new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(p.data_inicio_prevista))}</div> : null}
                              {p.prazo_execucao_meses || p.prazo_execucao_mes ? <div><strong>Prazo (meses):</strong> {p.prazo_execucao_meses || p.prazo_execucao_mes}</div> : null}
                              {p.urgency ? <div><strong>Urgência:</strong> {(URGENCY_LEVELS as any)[p.urgency]?.name || p.urgency}</div> : null}
                            </div>
                            <div className="mt-3 text-sm text-gray-700">{p.description}</div>
                            {Array.isArray(p.services) && p.services.length ? (
                              <div className="mt-3 w-full space-y-2">
                                {p.services.map((s: any, si: number) => {
                                  const serviceLabel = (SERVICES as any)[s.service]?.name || s.service || `Serviço ${si + 1}`
                                  const budgetLabel = BUDGET_RANGES.find((b: any) => b.value === s.budget)?.label || ''
                                  const urgencyLabel = (URGENCY_LEVELS as any)[s.urgency]?.name || ''
                                  const statusLabel = s.status === 'respondido' ? (language === 'pt' ? 'Respondido' : 'Answered') : s.status === 'pendente' ? (language === 'pt' ? 'Pendente' : 'Pending') : (s.status || '')
                                  const roleLower = String(currentUser?.role || '').toLowerCase()
                                  return (
                                    <div key={si} className="w-full border border-gray-200 rounded-md bg-white p-3 shadow-sm">
                                      <Collapsible defaultOpen={false}>
                                        <div className="w-full">
                                          <CollapsibleTrigger className="w-full text-left flex items-center justify-between px-3 py-2">
                                            <div className="flex items-center space-x-3">
                                              <div className="text-sm font-medium text-gray-800">{serviceLabel}</div>
                                              <div className="text-xs text-gray-500">{budgetLabel ? `${budgetLabel}` : ''}{urgencyLabel ? ` • ${urgencyLabel}` : ''}</div>
                                              {s.status && (
                                                <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'respondido' ? 'bg-blue-100 text-blue-800' : s.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{statusLabel}</span>
                                              )}
                                            </div>
                                            <div className="text-sm text-gray-500">{language === 'pt' ? 'Detalhes' : 'Details'}</div>
                                          </CollapsibleTrigger>
                                        </div>
                                        <CollapsibleContent className="p-3 text-sm text-gray-700">
                                          <div className="mb-2">{s.description}</div>
                                          <div className="text-xs text-gray-500">{language === 'pt' ? 'Urgência' : 'Urgency'}: {urgencyLabel || '—'}</div>
                                          <div className="text-xs text-gray-500">{language === 'pt' ? 'Orçamento' : 'Budget'}: {budgetLabel || '—'}</div>
                                          {s.responsavel_tecnico && (
                                            <div className="text-xs text-gray-500">{language === 'pt' ? 'Franqueado Responsável' : 'Responsible Franchisee'}: {s.responsavel_tecnico}</div>
                                          )}
                                          {roleLower === 'franqueado' && (
                                            <div className="mt-3 flex gap-2">
                                              {(() => {
                                                const myId = (currentUser?.full_name || currentUser?.email || '').trim()
                                                const isMine = Boolean(s.responsavel_tecnico) && String(s.responsavel_tecnico).trim() === myId
                                                if (s.status !== 'respondido') {
                                                  return (
                                                    <button
                                                      onClick={async () => {
                                                        try {
                                                          const res = await fetch(`/api/servicos/${s.id}/angariar`, { method: 'POST' })
                                                          const data = await res.json()
                                                          if (data.ok) {
                                                            setProjetos(prev => prev.map(pr => pr.id === p.id ? { ...pr, services: (pr.services || []).map((sv: any) => (sv.id === s.id ? { ...sv, status: 'respondido', responsavel_tecnico: (currentUser?.full_name || currentUser?.email || '') } : sv)) } : pr))
                                                          } else {
                                                            alert(data.error || 'Erro ao angariar serviço')
                                                          }
                                                        } catch (e:any) {
                                                          alert('Erro ao angariar serviço')
                                                        }
                                                      }}
                                                      className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                                    >
                                                      {language === 'pt' ? 'Angariar' : 'Claim'}
                                                    </button>
                                                  )
                                                }
                                                if (isMine) {
                                                  return (
                                                    <button
                                                      onClick={async () => {
                                                        try {
                                                          const res = await fetch(`/api/servicos/${s.id}/desistir`, { method: 'POST' })
                                                          const data = await res.json()
                                                          if (data.ok) {
                                                            setProjetos(prev => prev.map(pr => pr.id === p.id ? { ...pr, services: (pr.services || []).map((sv: any) => (sv.id === s.id ? { ...sv, status: 'pendente', responsavel_tecnico: null } : sv)) } : pr))
                                                          } else {
                                                            alert(data.error || 'Erro ao desistir do serviço')
                                                          }
                                                        } catch (e:any) {
                                                          alert('Erro ao desistir do serviço')
                                                        }
                                                      }}
                                                      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                                                    >
                                                      {language === 'pt' ? 'Desistir' : 'Unclaim'}
                                                    </button>
                                                  )
                                                }
                                                return null
                                              })()}
                                            </div>
                                          )}
                                        </CollapsibleContent>
                                      </Collapsible>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : null}
                            {(!p.responsavel_tecnico && currentUser && ['franqueador'].includes(String(currentUser.role||'').toLowerCase())) ? (
                              <div className="mt-4">
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/projetos/${p.id}/angariar`, { method: 'POST' })
                                      const data = await res.json()
                                      if (data.ok) {
                                        setProjetos(prev => prev.map(pr => pr.id === p.id ? { ...pr, responsavel_tecnico: data.projeto?.responsavel_tecnico || (currentUser?.full_name || currentUser?.email || 'Eu'), status: (pr.status === 'pendente' ? 'respondido' : pr.status) } : pr))
                                      } else {
                                        console.error('Failed to assign', data.error)
                                        alert(data.error || 'Erro ao atribuir')
                                      }
                                    } catch (e:any) {
                                      console.error(e)
                                      alert('Erro ao atribuir')
                                    }
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                >
                                  {language === 'pt' ? 'Angariar' : 'Claim'}
                                </button>
                              </div>
                            ) : null}
                            {(p.responsavel_tecnico && currentUser && ['franqueador','admin'].includes(String(currentUser.role||'').toLowerCase()) &&
                              (p.responsavel_tecnico === (currentUser.full_name || currentUser.email))) ? (
                              <div className="mt-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/projetos/${p.id}/desistir`, { method: 'POST' })
                                      const data = await res.json()
                                      if (data.ok) {
                                        setProjetos(prev => prev.map(pr => pr.id === p.id ? { ...pr, responsavel_tecnico: null, status: (pr.status === 'respondido' ? 'pendente' : pr.status) } : pr))
                                      } else {
                                        alert(data.error || 'Erro ao desistir')
                                      }
                                    } catch (e:any) {
                                      alert('Erro ao desistir')
                                    }
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                                >
                                  {language === 'pt' ? 'Desistir' : 'Unclaim'}
                                </button>
                              </div>
                            ) : null}
                            {currentUser && String(currentUser?.role || '').toLowerCase() === 'cliente' ? (
                              <div className="mt-3">
                                <button
                                  onClick={() => {
                                    try { sessionStorage.setItem('afix_edit_projeto', JSON.stringify(p)) } catch (e) {}
                                    try { const { setEditingProjeto } = require('@/lib/editCache'); setEditingProjeto(p) } catch (e) {}
                                    router.push(`/projetos/${p.id}/edit`)
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                >
                                  {language === 'pt' ? 'Editar' : 'Edit'}
                                </button>
                              </div>
                            ) : null}
                          </>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              )
            }
            return (
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
            )
          })()}
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
      // Avoid flashing Home before we know if the user is logged in
      if (!authLoaded) {
        return <div className="py-16 text-center text-sm text-gray-500">{language === 'pt' ? 'A carregar...' : 'Loading...'}</div>
      }
      // If the activeTab explicitly requests the franchise view, honor it regardless
      // of authentication state (so clicking the "Franquia" menu opens the Home tab).
  if (activeTab === 'franchise') return <FranchisePage />
  if (activeTab === 'chat') return <ChatPage />

  // If the active tab explicitly requests the dashboard, only show it to admins.
  // Otherwise, if the user is a client/franchisee/franchisor and is on the Home tab,
  // show their projects (the Dashboard view) automatically — this restores the
  // previous behaviour where clients saw their projects after login.
  if (activeTab === 'dashboard') {
    // Show Projects page for any role when the dashboard/projects tab is requested
    return <ProjectsPage />;
  }

  // Auto-show projects for authenticated client-like roles when on Home
  const _role = String(currentUser?.role || '').toLowerCase();
  if (currentUser && ['cliente', 'franqueado', 'franqueador'].includes(_role) && activeTab === 'home') {
    return <ProjectsPage />
  }

  switch (activeTab) {
    case 'home':
      return <HomePage />;
    case 'quote':
      return <QuotePage />;
    default:
      return <HomePage />;
  }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderContent()}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div />}> 
      <HomeContent />
    </Suspense>
  )
}