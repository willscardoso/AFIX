"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { URGENCY_LEVELS, BUDGET_RANGES, SERVICES } from '@/lib/constants'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { useLanguage } from '@/hooks/useLanguage'
import dynamic from 'next/dynamic'
import { useCallback } from 'react'
// SiteHeader and SiteFooter are provided globally by the root layout

// helper: given a service key or legacy label, return the service key and display name
function resolveServiceKeyAndLabel(v: any) {
  if (!v) return { key: '', label: '' }
  // if already a key
  if (Object.prototype.hasOwnProperty.call(SERVICES, v)) {
    const key = v as keyof typeof SERVICES
    return { key, label: (SERVICES as any)[key].name }
  }
  // try to match by display name
  for (const [k, val] of Object.entries(SERVICES)) {
    if (v === (val as any).name || v === (val as any).nameEn) return { key: k, label: (val as any).name }
  }
  // fallback: return original value as label
  return { key: String(v), label: String(v) }
}

export default function EditProjetoPage() {
  const router = useRouter()
  const params = useSearchParams()
  // When mounted under /projetos/[id]/edit the id is part of the pathname, not search params.
  let id = params?.get('id') || ''
  if (!id && typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean)
    // expected: ['projetos', '{id}', 'edit']
    if (parts.length >= 2) id = parts[1]
  }
  const { toast } = useToast()
  // Try to synchronously read cached projeto so first render can show the form immediately.
  // Prefer in-memory cache (fast) then fall back to sessionStorage.
  let cachedProjeto: any = null
  try {
    if (typeof window !== 'undefined') {
      try {
        const { takeEditingProjeto, peekEditingProjeto } = require('@/lib/editCache')
        // takeEditingProjeto returns and clears the in-memory cache if id matches
        cachedProjeto = takeEditingProjeto(id) || peekEditingProjeto()
      } catch (e) {
        // ignore module require issues (fallback to sessionStorage)
      }

      if (!cachedProjeto) {
        const raw = sessionStorage.getItem('afix_edit_projeto')
        if (raw) {
          const p = JSON.parse(raw)
          if (p && String(p.id) === String(id)) cachedProjeto = p
        }
      }
    }
  } catch (e) {
    // ignore
  }

  const [loading, setLoading] = useState<boolean>(cachedProjeto ? false : true)
  const [saving, setSaving] = useState(false)
  const [projeto, setProjeto] = useState<any>(cachedProjeto)
  const [validationErrors, setValidationErrors] = useState<number[]>([])
  const [form, setForm] = useState(() => ({
    full_name: cachedProjeto?.full_name || '',
  // contact fields: email/phone were removed from some schemas; keep only name
    // services will be an array of service items: { service, description, budget, urgency }
    services: (() => {
      // prefer cachedProjeto.services if present (listing may have annotated this)
      try {
        if (cachedProjeto && Array.isArray((cachedProjeto as any).services)) {
          const findKey = (v: any) => { if (!v) return ''; for (const [k, val] of Object.entries(SERVICES)) { if (v === k || v === (val as any).name || v === (val as any).nameEn) return k } return v }
          return (cachedProjeto.services || []).map((s: any) => ({ service: findKey(s.service || s.servico || s), description: s.description || s.descricao || '', budget: s.budget || s.orcamento_range || '', urgency: s.urgency || s.urgencia || '' }))
        }
      } catch (e) {}
      // fallback to legacy `service` string or single-item fields
      if (cachedProjeto?.service) {
        try {
          const parsed = JSON.parse(cachedProjeto.service)
          if (Array.isArray(parsed)) {
            const findKey = (v: any) => { if (!v) return ''; for (const [k, val] of Object.entries(SERVICES)) { if (v === k || v === (val as any).name || v === (val as any).nameEn) return k } return v }
            return parsed.map((p: any) => ({ service: findKey(p.service), description: p.description, budget: p.budget, urgency: p.urgency }))
          }
        } catch (e) {}
        const svcVal = cachedProjeto?.service || ''
        const mapped = (function findKey(v: any){ if(!v) return ''; for(const [k,val] of Object.entries(SERVICES)){ if(v === k || v === (val as any).name || v === (val as any).nameEn) return k } return v })(svcVal)
        return [{ service: mapped, description: cachedProjeto?.description || '', budget: cachedProjeto?.budget || '', urgency: cachedProjeto?.urgency || '' }]
      }
      return [{ service: '', description: '', budget: '', urgency: '' }]
    })(),
    location: cachedProjeto?.location || '',
    localizacao: cachedProjeto?.localizacao || '',
    responsavel_tecnico: cachedProjeto?.responsavel_tecnico || '',
    data_inicio_prevista: cachedProjeto?.data_inicio_prevista || '',
    prazo_execucao_meses: cachedProjeto?.prazo_execucao_meses || cachedProjeto?.prazo_execucao_mes || '',
    budget: cachedProjeto?.budget || '',
    urgency: cachedProjeto?.urgency || '',
    created_at: cachedProjeto?.created_at || '',
    status: cachedProjeto?.status || ''
  }))
  // map preview removed (was using OSM / Google / Mapbox iframes)

  const { language } = useLanguage()

  // geocoding and map preview disabled to avoid external map dependencies

  useEffect(() => {
    if (!id) return
    let mounted = true

    ;(async () => {
      try {
        // Fetch fresh copy in background; don't force the loading indicator if we already had cached data
        const res = await fetch(`/api/projetos/${id}`, { credentials: 'same-origin' })
        const payload = await res.json()
        if (!mounted) return
        if (!res.ok || !payload.ok) {
          // if we had no cached data and fetch failed, notify
          if (!projeto) toast({ title: 'Erro', description: payload.error || 'Failed to load' })
        } else {
          setProjeto(payload.projeto)
          // normalize services: prefer payload.projeto.services (normalized API); otherwise try legacy service field
          const services = (() => {
            const findKey = (v: any) => { if (!v) return ''; for (const [k, val] of Object.entries(SERVICES)) { if (v === k || v === (val as any).name || v === (val as any).nameEn) return k } return v }
            try {
              if (payload.projeto.services && Array.isArray(payload.projeto.services)) {
                return payload.projeto.services.map((s: any) => ({ service: findKey(s.service || s.servico || ''), description: s.description || s.descricao || '', budget: s.budget || s.orcamento_range || '', urgency: s.urgency || s.urgencia || '' }))
              }
              if (payload.projeto.service) {
                const parsed = JSON.parse(payload.projeto.service)
                if (Array.isArray(parsed)) return parsed.map((p: any) => ({ service: findKey(p.service), description: p.description, budget: p.budget, urgency: p.urgency }))
              }
            } catch (e) {
              // ignore
            }
            return [{ service: findKey(payload.projeto.service || ''), description: payload.projeto.description || '', budget: payload.projeto.budget || '', urgency: payload.projeto.urgency || '' }]
          })()

          setForm({
            full_name: payload.projeto.full_name || '',
            services,
            location: payload.projeto.location || '',
            localizacao: payload.projeto.localizacao || '',
            responsavel_tecnico: payload.projeto.responsavel_tecnico || '',
            data_inicio_prevista: payload.projeto.data_inicio_prevista || '',
            prazo_execucao_meses: payload.projeto.prazo_execucao_meses || payload.projeto.prazo_execucao_mes || '',
            budget: payload.projeto.budget || '',
            urgency: payload.projeto.urgency || '',
            created_at: payload.projeto.created_at || '',
            status: payload.projeto.status || ''
          })
        }
      } catch (e: any) {
        if (!projeto) toast({ title: 'Erro', description: e?.message ?? String(e) })
      } finally {
        if (mounted) setLoading(false)
        try { sessionStorage.removeItem('afix_edit_projeto') } catch (e) { /* ignore */ }
      }
    })()
    return () => { mounted = false }
  }, [id, toast])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    // per-service validation: ensure service name is present
    const missing = (form.services || []).map((s: any, i: number) => (!s || !String(s.service || '').trim() ? i : -1)).filter((i: number) => i >= 0)
    if (missing.length) {
      setValidationErrors(missing)
      toast({ title: 'Erro', description: 'Cada serviço precisa de um nome.' })
      setSaving(false)
      return
    }
    setValidationErrors([])
      try {
        // prepare payload: include both legacy `service` JSON string (for backward compatibility)
        // and the new `services` array so the server can upsert normalized rows.
        const payloadBody: any = { ...form }
        try {
          payloadBody.service = JSON.stringify(form.services || [])
        } catch (e) {
          payloadBody.service = String((form.services || []).map((s: any) => s.service).join(', '))
        }
        // keep the `services` array so the server can upsert into projeto_servicos

        const res = await fetch(`/api/me/projetos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadBody)
        })
      const payload = await res.json()
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Failed')
  toast({ title: 'Guardado', description: 'Projeto atualizado' })
  router.push('/?tab=dashboard')
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? String(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="py-8">
  <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Editar Projeto</h2>
        {loading ? (
          <div>Carregando...</div>
        ) : !projeto ? (
          <div>Projeto não encontrado</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full text-left">
                <h3 className="text-lg font-medium">Contacto</h3>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full border px-3 py-2 rounded" />
                  </div>
                    {/* nome_projeto removed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localização / Morada</label>
                    <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Rua Example 123, Lisboa" className="w-full border px-3 py-2 rounded" />
                    {/* Map preview removed */}
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Localização (detalhe)</label>
                      <input value={form.localizacao} onChange={(e) => setForm(f => ({ ...f, localizacao: e.target.value }))} className="w-full border px-3 py-2 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Responsável Técnico</label>
                      <input value={form.responsavel_tecnico} onChange={(e) => setForm(f => ({ ...f, responsavel_tecnico: e.target.value }))} className="w-full border px-3 py-2 rounded" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Início Prevista</label>
                        <input type="date" value={form.data_inicio_prevista ? String(form.data_inicio_prevista).slice(0,10) : ''} onChange={(e) => setForm(f => ({ ...f, data_inicio_prevista: e.target.value }))} className="w-full border px-3 py-2 rounded" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (meses)</label>
                        <input type="number" min={0} value={form.prazo_execucao_meses || ''} onChange={(e) => setForm(f => ({ ...f, prazo_execucao_meses: e.target.value }))} className="w-full border px-3 py-2 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento (projeto)</label>
                        <select value={form.budget || ''} onChange={(e) => setForm(f => ({ ...f, budget: e.target.value }))} className="w-full border px-3 py-2 rounded">
                          <option value="">-- selecione --</option>
                          {BUDGET_RANGES.map((b) => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Urgência (projeto)</label>
                        <select value={form.urgency || ''} onChange={(e) => setForm(f => ({ ...f, urgency: e.target.value }))} className="w-full border px-3 py-2 rounded">
                          <option value="">-- selecione --</option>
                          {Object.entries(URGENCY_LEVELS).map(([key, val]: any) => (
                            <option key={key} value={key}>{val.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Criado em</label>
                      <div className="w-full border px-3 py-2 rounded bg-gray-50 text-sm">{form.created_at ? new Date(form.created_at).toLocaleString() : '—'}</div>
                    </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Services section: multiple services per project */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full text-left">
                <h3 className="text-lg font-medium">Serviços</h3>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 mt-3">
                          {form.services.map((svc: any, idx: number) => {
                            const budgetLabel = BUDGET_RANGES.find(b => b.value === svc.budget)?.label || ''
                            const urgencyLabel = (URGENCY_LEVELS as any)[svc.urgency]?.name || ''
                            const { label: serviceLabel } = resolveServiceKeyAndLabel(svc.service || `Serviço #${idx + 1}`)
                            return (
                              <div key={idx} className="border rounded">
                                <Collapsible defaultOpen={false}>
                                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                                    <CollapsibleTrigger className="w-full text-left flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="text-sm font-medium">{serviceLabel}</div>
                                        <div className="text-xs text-gray-500">{budgetLabel ? `• ${budgetLabel}` : ''} {urgencyLabel ? ` • ${urgencyLabel}` : ''}</div>
                                      </div>
                                      <div className="text-sm text-gray-500">Editar</div>
                                    </CollapsibleTrigger>
                                  </div>
                                  <CollapsibleContent>
                                    <div className="p-3 space-y-3">
                                      <div className="flex justify-end">
                                        <button type="button" onClick={() => setForm(f => ({ ...f, services: f.services.filter((_: any, i: number) => i !== idx) }))} className="text-red-600 hover:underline text-sm">Remover</button>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
                                        <select value={svc.service} onChange={(e) => setForm(f => ({ ...f, services: f.services.map((s: any, i: number) => i === idx ? { ...s, service: e.target.value } : s) }))} className={`w-full border px-3 py-2 rounded ${validationErrors.includes(idx) ? 'border-red-500' : ''}`}>
                                          <option value="">-- selecione --</option>
                                          {svc.service && !Object.prototype.hasOwnProperty.call(SERVICES, svc.service) ? <option value={svc.service}>{svc.service}</option> : null}
                                          {Object.entries(SERVICES).map(([key, val]) => (
                                            <option key={key} value={key}>{(val as any).name}</option>
                                          ))}
                                        </select>
                                        {validationErrors.includes(idx) ? <div className="text-red-600 text-sm mt-1">Nome do serviço é obrigatório</div> : null}
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento</label>
                                        <select value={svc.budget} onChange={(e) => setForm(f => ({ ...f, services: f.services.map((s: any, i: number) => i === idx ? { ...s, budget: e.target.value } : s) }))} className="w-full border px-3 py-2 rounded">
                                          <option value="">-- selecione --</option>
                                          {BUDGET_RANGES.map((b) => (
                                            <option key={b.value} value={b.value}>{b.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Urgência</label>
                                        <select value={svc.urgency} onChange={(e) => setForm(f => ({ ...f, services: f.services.map((s: any, i: number) => i === idx ? { ...s, urgency: e.target.value } : s) }))} className="w-full border px-3 py-2 rounded">
                                          <option value="">-- selecione --</option>
                                          {Object.entries(URGENCY_LEVELS).map(([key, val]: any) => (
                                            <option key={key} value={key}>{val.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                        <textarea value={svc.description} onChange={(e) => setForm(f => ({ ...f, services: f.services.map((s: any, i: number) => i === idx ? { ...s, description: e.target.value } : s) }))} className="w-full border px-3 py-2 rounded h-24" />
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            )
                          })}
                  <div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, services: [...f.services, { service: '', description: '', budget: '', urgency: '' }] }))} className="text-blue-600 hover:underline text-sm">+ Adicionar serviço</button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border px-3 py-2 rounded">
                <option value="">-- selecione --</option>
                <option value="pendente">pendente</option>
                <option value="em_analise">em_analise</option>
                <option value="respondido">respondido</option>
                <option value="finalizado">finalizado</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? 'A gravar...' : 'Guardar'}</button>
              <button type="button" onClick={() => router.push('/?tab=dashboard')} className="text-sm text-gray-600">Cancelar</button>
            </div>
          </form>
        )}
          </div>
        </div>
      </main>
    </div>
  )
}
