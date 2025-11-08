import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 })
  try {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    // only cliente, franqueado or franqueador can edit their own projects
    const role = String((user.role || '')).toLowerCase()
    if (!['cliente', 'franqueado', 'franqueador'].includes(role)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

  // In some Next.js runtimes `params` can be a promise-like value; avoid that by
  // extracting the dynamic id directly from the request URL.
  const id = String(new URL(req.url).pathname.split('/').filter(Boolean).pop() || '')
    const body = await req.json()
    // ensure project belongs to user (by email) before allowing update
  // Prefer to validate ownership via the `projeto_users` link table (newer schema).
  try {
    const link = await (supabaseAdmin as any).from('projeto_users').select('id').eq('projeto_id', id).eq('user_id', String(user.id)).maybeSingle()
    if (!link.error && link.data) {
      // ownership confirmed
    } else {
      // If user is admin allow; otherwise try legacy fallback via projetos.email
      const role = String((user.role || '')).toLowerCase()
      if (role === 'admin') {
        // admin allowed
      } else {
        // legacy fallback: check projetos.email if projeto_users mapping missing
        const existing = await (supabaseAdmin as any).from('projetos').select('email').eq('id', id).maybeSingle()
        if ((existing as any).error) return NextResponse.json({ ok: false, error: String((existing as any).error.message || (existing as any).error) }, { status: 500 })
        const proj = (existing as any).data
        if (!proj) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
        if (proj.email) {
          if (!user.email || String((proj.email || '')).toLowerCase() !== String((user.email || '')).toLowerCase()) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
        } else {
          // cannot determine ownership; deny
          return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
        }
      }
    }
  } catch (e) {
    // if projeto_users doesn't exist, fall back to legacy email ownership check
    const existing = await (supabaseAdmin as any).from('projetos').select('email').eq('id', id).maybeSingle()
    if ((existing as any).error) return NextResponse.json({ ok: false, error: String((existing as any).error.message || (existing as any).error) }, { status: 500 })
    const proj = (existing as any).data
    if (!proj) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    if (proj.email) {
      if (!user.email || String((proj.email || '')).toLowerCase() !== String((user.email || '')).toLowerCase()) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    } else {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
  }

    // allow only specific fields to be updated on the projetos table (contact/status)
  // allow only specific fields to be updated on the projetos table (contact/status)
  const allowed: any = {}
  if (body.full_name !== undefined) allowed.full_name = String(body.full_name)
  // email/phone columns were removed in some schemas; do not attempt to update them here
  if (body.location !== undefined) allowed.location = String(body.location)
  // Accept additional projeto fields if provided (project metadata)
  if (body.localizacao !== undefined) allowed.localizacao = String(body.localizacao)
  if (body.responsavel_tecnico !== undefined) allowed.responsavel_tecnico = String(body.responsavel_tecnico)
  if (body.data_inicio_prevista !== undefined) {
    // validate date-ish value; store as provided string
    const d = String(body.data_inicio_prevista)
    allowed.data_inicio_prevista = d
  }
  if (body.prazo_execucao_meses !== undefined) {
    const n = Number(body.prazo_execucao_meses)
    if (!Number.isNaN(n)) allowed.prazo_execucao_meses = n
  }
  // allow updating project-level budget and urgency
  if (body.budget !== undefined) {
    const b = String(body.budget)
    allowed.budget = b
  }
  if (body.urgency !== undefined) {
    allowed.urgency = String(body.urgency)
  }
    if (body.status !== undefined) {
      const s = String(body.status)
      // restrict to known statuses
      const allowedStatuses = ['pendente', 'em_analise', 'respondido', 'finalizado']
      if (allowedStatuses.includes(s)) allowed.status = s
    }

    // update projetos contact/status fields first
    const { data, error } = await (supabaseAdmin as any).from('projetos').update(allowed).eq('id', id).select('*').maybeSingle()
    if (error) return NextResponse.json({ ok: false, error: String(error.message || error) }, { status: 500 })

    // If caller provided a services array, upsert into projeto_servicos (normalized table)
    if (Array.isArray(body.services)) {
      try {
        // remove existing services for this projeto, then insert the provided ones
        const del = await (supabaseAdmin as any).from('projeto_servicos').delete().eq('projeto_id', id)
        if (del.error) {
          // non-fatal, continue
        }
        const rows = (body.services || []).map((s: any) => ({
          projeto_id: id,
          servico: s.service || s.servico || '',
          descricao: s.description || s.descricao || null,
          orcamento_range: s.budget || s.orcamento_range || null,
          urgencia_level: s.urgency || s.urgencia || null,
          status: s.status || 'pendente'
        }))
        if (rows.length) {
          const ins = await (supabaseAdmin as any).from('projeto_servicos').insert(rows)
          if (ins.error) return NextResponse.json({ ok: false, error: String(ins.error.message || ins.error) }, { status: 500 })
        }
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 })
      }
    }

    // Attach current projeto_servicos rows to the returned projeto for client convenience
    try {
      const svcResFinal = await (supabaseAdmin as any).from('projeto_servicos').select('id,servico,descricao,orcamento_range,urgencia_level,status,responsavel_tecnico,created_at').eq('projeto_id', id)
      if (!svcResFinal.error) {
        const services = (svcResFinal.data || []).map((s: any) => ({ id: s.id, service: s.servico, description: s.descricao, budget: s.orcamento_range, urgency: s.urgencia_level, status: s.status, responsavel_tecnico: s.responsavel_tecnico, created_at: s.created_at }))
        return NextResponse.json({ ok: true, projeto: { ...(data || {}), services } })
      }
    } catch (e) {
      // ignore and fall back
    }
    return NextResponse.json({ ok: true, projeto: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}
