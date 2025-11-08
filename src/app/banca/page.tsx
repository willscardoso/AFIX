"use client"

import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { SERVICES, URGENCY_LEVELS, BUDGET_RANGES } from '@/lib/constants'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

export default function BancaPage() {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [projetos, setProjetos] = useState<any[]>([])
  const [user, setUser] = useState<any | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [isEmbedded, setIsEmbedded] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // determine whether this component is being rendered inside the Home page
    if (typeof window !== 'undefined') {
      setIsEmbedded(window.location.pathname === '/')
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const me = await fetch('/api/auth/me')
        const mePayload = await me.json()
        if (mounted && me.ok && mePayload.ok) setUser(mePayload.user)
      } catch (e) {
        // ignore
      }

      try {
        const q = filterStatus && filterStatus !== 'all' ? `/api/me/projetos?status=${encodeURIComponent(filterStatus)}` : '/api/me/projetos'
        const res = await fetch(q, { credentials: 'same-origin' })
        const payload = await res.json()
        if (!mounted) return
        if (!res.ok || !payload.ok) {
          toast({ title: language === 'pt' ? 'Erro' : 'Error', description: payload.error || 'Failed to load' })
          setProjetos([])
        } else {
          setProjetos(payload.projetos || [])
        }
      } catch (err: any) {
        toast({ title: language === 'pt' ? 'Erro' : 'Error', description: err?.message ?? String(err) })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [language, toast, filterStatus])

  function renderContent() {
    // dashboard style view: show summary cards and recent projects
    const total = projetos.length
    const countPendente = projetos.filter(p => String(p.status || '').toLowerCase() === 'pendente').length
    const countAnalise = projetos.filter(p => String(p.status || '').toLowerCase() === 'em_analise').length
    const countFinalizado = projetos.filter(p => String(p.status || '').toLowerCase() === 'finalizado').length
    const totalBudget = projetos.reduce((acc, p) => acc + (Number(p.budget) || 0), 0)

    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{language === 'pt' ? 'Dashboard' : 'Dashboard'}</h1>
          <button onClick={() => router.push('/')} className="text-sm text-blue-600">{language === 'pt' ? 'Voltar' : 'Back'}</button>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="text-sm text-gray-500">{language === 'pt' ? 'Total Projetos' : 'Total Projects'}</div>
            <div className="text-2xl font-bold">{total}</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="text-sm text-gray-500">{language === 'pt' ? 'Pendente' : 'Pending'}</div>
            <div className="text-2xl font-bold">{countPendente}</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="text-sm text-gray-500">{language === 'pt' ? 'Em Análise' : 'In Analysis'}</div>
            <div className="text-2xl font-bold">{countAnalise}</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="text-sm text-gray-500">{language === 'pt' ? 'Finalizado' : 'Finished'}</div>
            <div className="text-2xl font-bold">{countFinalizado}</div>
          </div>
        </div>

        {/* Two-column section: summary + services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{language === 'pt' ? 'Pedidos Recentes' : 'Recent Requests'}</h3>
            <div className="text-sm text-gray-600">
              {language === 'pt' ? `Total de pedidos: ${total} • Orçamento total: € ${totalBudget}` : `Total requests: ${total} • Total budget: € ${totalBudget}`}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{language === 'pt' ? 'Serviços Mais Solicitados' : 'Most Requested Services'}</h3>
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
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>

                  
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If we don't yet know embedding state, render nothing to avoid mismatch on server render
  if (isEmbedded === null) return null

  if (isEmbedded) {
    // When embedded on the Home page we only show the projects list with the title
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{language === 'pt' ? 'Projectos' : 'Projects'}</h1>
            <button onClick={() => router.push('/banca')} className="text-sm text-blue-600">{language === 'pt' ? 'Ver Dashboard' : 'View Dashboard'}</button>
          </div>

          {loading ? (
            <div className="text-center text-gray-600">{language === 'pt' ? 'A carregar...' : 'Loading...'}</div>
          ) : projetos.length === 0 ? (
            <div className="text-center text-gray-600">{language === 'pt' ? 'Nenhum projeto encontrado.' : 'No projects found.'}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projetos.slice(0, 10).map((p) => (
                <div key={p.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{p.full_name || 'Projeto'}</h3>
                        <div className="text-xs text-gray-500 ml-3">{new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(p.created_at))}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className={`px-2 py-1 rounded-full text-sm font-medium ${p.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : p.status === 'em_analise' ? 'bg-blue-100 text-blue-800' : p.status === 'finalizado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {p.status}
                      </div>
                      <div className="text-lg font-medium">{(() => {
                        const label = BUDGET_RANGES.find((b: any) => b.value === p.budget)?.label
                        return label || (p.budget ? String(p.budget) : '')
                      })()}</div>
                    </div>
                  </div>

                  {/* Show project metadata before the description */}
                  <div className="mt-3 text-sm text-gray-600 w-full">
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {p.location ? <div><strong>Morada:</strong> {p.location}</div> : null}
                        {p.localizacao ? <div><strong>Localização:</strong> {p.localizacao}</div> : null}
                        {p.responsavel_tecnico ? <div><strong>Responsável Técnico:</strong> {p.responsavel_tecnico}</div> : null}
                        {p.data_inicio_prevista ? <div><strong>Início previsto:</strong> {new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(p.data_inicio_prevista))}</div> : null}
                        {p.prazo_execucao_meses || p.prazo_execucao_mes ? <div><strong>Prazo (meses):</strong> {p.prazo_execucao_meses || p.prazo_execucao_mes}</div> : null}
                        {p.urgency ? <div><strong>Urgência:</strong> {(URGENCY_LEVELS as any)[p.urgency]?.name || p.urgency}</div> : null}
                    </div>
                    <div className="mt-3 text-justify whitespace-pre-wrap">{p.description}</div>
                    {/* Map preview removed to avoid external map embeds */}
                  </div>

                  {/* Services accordion (full width) */}
                  <div className="mt-3 space-y-2 w-full">
                    {Array.isArray(p.services) && p.services.length ? (
                      p.services.map((s: any, si: number) => {
                        const serviceLabel = (SERVICES as any)[s.service]?.name || s.service || `Serviço ${si + 1}`
                        const budgetLabel = BUDGET_RANGES.find((b: any) => b.value === s.budget)?.label || ''
                        const urgencyLabel = (URGENCY_LEVELS as any)[s.urgency]?.name || ''
                        return (
                          <div className="w-full" key={si}>
                            <Collapsible defaultOpen={false}>
                              <div className="border rounded w-full">
                                <div className="px-3 py-2 bg-gray-50 w-full">
                                  <CollapsibleTrigger className="w-full text-left flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="text-sm font-medium text-gray-800">{serviceLabel}</div>
                                      {budgetLabel ? <div className="text-xs text-gray-500">• {budgetLabel}</div> : null}
                                    </div>
                                    <div className="text-xs text-gray-500">{urgencyLabel ? urgencyLabel : ''}</div>
                                  </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent className="w-full">
                                  <div className="p-3 text-sm text-gray-700 w-full">
                                    <div className="mb-2">{s.description}</div>
                                    <div className="text-xs text-gray-500">Urgência: {urgencyLabel || '—'}</div>
                                    <div className="text-xs text-gray-500">Orçamento: {budgetLabel || '—'}</div>
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-sm text-gray-600">{p.service}</div>
                    )}
                  </div>
                    <div className="mt-3 text-right">
                      {user && ['cliente', 'franqueado', 'franqueador'].includes(String((user.role || '')).toLowerCase()) && ((p.user_id && user.id && String(user.id) === String(p.user_id)) || (user.email && p.email && String(user.email || '').toLowerCase() === String(p.email || '').toLowerCase())) && (
                        <button onClick={() => { try { sessionStorage.setItem('afix_edit_projeto', JSON.stringify(p)) } catch (e) {} ; try { const { setEditingProjeto } = require('@/lib/editCache'); setEditingProjeto(p) } catch (e) {} ; router.push(`/projetos/${p.id}/edit`) }} className="text-sm text-blue-600 hover:underline">{language === 'pt' ? 'Editar' : 'Edit'}</button>
                      )}
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="py-8">
        <div className="max-w-5xl mx-auto p-8 bg-gray-50">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
