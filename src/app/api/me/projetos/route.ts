import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured: SUPABASE_SERVICE_ROLE not set' }, { status: 500 })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

  // Behavior by role with optional server-side status filter (?status=...):
  // - admin: default return projects with status 'finalizado' unless status param provided
  // - franqueado / franqueador: behave like 'cliente' (see only their own projects)
  // - cliente: return only the user's projects (can be filtered by status if provided)
    const url = new URL(req.url)
    const statusParam = url.searchParams.get('status') // e.g. 'pendente', 'em_analise', 'finalizado' or 'all'

  // Select all columns to be resilient to schema changes (some installations may have removed email/phone)
  let query = (supabaseAdmin as any).from('projetos').select('*')
    const role = String((user.role || '') || '').toLowerCase()

    if (role === 'admin') {
      if (statusParam && statusParam !== 'all') {
        query = query.eq('status', statusParam)
      } else {
        query = query.eq('status', 'finalizado')
      }
      query = query.order('created_at', { ascending: false }).limit(200)
    } else if (role === 'franqueado' || role === 'franqueador') {
      // treat franqueado/franqueador like cliente: show only their own projects
      // use case-insensitive match for email
        // franqueado/franqueador should see all projects; optionally filtered by statusParam
        if (statusParam && statusParam !== 'all') {
          query = query.eq('status', statusParam)
        }
        query = query.order('created_at', { ascending: false }).limit(200)
    } else {
      // cliente: prefer to find projects linked via projeto_users (newer normalized schema).
      // If projeto_users is not available or contains no rows for this user, fall back to legacy email matching.
      if (['cliente'].includes(role)) {
        try {
          const linkRes = await (supabaseAdmin as any).from('projeto_users').select('projeto_id').eq('user_id', String(user.id))
          if (!linkRes.error && Array.isArray(linkRes.data) && linkRes.data.length) {
            const ids = linkRes.data.map((r: any) => r.projeto_id).filter(Boolean)
            if (ids.length) {
              let projectsQuery = (supabaseAdmin as any).from('projetos').select('*').in('id', ids)
              if (statusParam && statusParam !== 'all') projectsQuery = projectsQuery.eq('status', statusParam)
              projectsQuery = projectsQuery.order('created_at', { ascending: false }).limit(200)
              const pr = await projectsQuery
              if (!pr.error) {
                const data = pr.data || []
                // attach services
                try {
                  const svcRes = await (supabaseAdmin as any).from('projeto_servicos').select('id,projeto_id,servico,orcamento_range,urgencia_level,descricao,status,responsavel_tecnico,created_at').in('projeto_id', ids)
                  if (!svcRes.error) {
                    const svcs = svcRes.data || []
                      const map: Record<string, any[]> = {}
                    svcs.forEach((s: any) => {
                      if (!map[s.projeto_id]) map[s.projeto_id] = []
                      map[s.projeto_id].push({ id: s.id, service: s.servico, budget: s.orcamento_range, urgency: s.urgencia_level, description: s.descricao, status: s.status, responsavel_tecnico: s.responsavel_tecnico, created_at: s.created_at })
                    })
                    const enhanced = (data || []).map((p: any) => ({ ...p, services: map[p.id] || [], service: p.service, user_id: String(user.id) }))
                    return NextResponse.json({ ok: true, projetos: enhanced })
                  }
                } catch (e) {
                  // ignore and fall through
                }
                  const annotated = (data || []).map((p: any) => ({ ...p, user_id: String(user.id) }))
                return NextResponse.json({ ok: true, projetos: annotated })
              }
            }
          }
        } catch (e) {
          // if projeto_users table doesn't exist or another error occurred, fall back to legacy behavior below
        }

        // legacy fallback by email
        if (user.email) query = query.eq('email', String(user.email || ''))
        if (statusParam && statusParam !== 'all') query = query.eq('status', statusParam)
        query = query.order('created_at', { ascending: false }).limit(200)
      } else {
        // franqueado/franqueador: behave like cliente (show only their own projects)
        if (statusParam && statusParam !== 'all') {
          query = query.eq('status', statusParam)
        }
        query = query.order('created_at', { ascending: false }).limit(200)
      }
    }
    const { data, error } = await query
    if (error) {
      return NextResponse.json({ ok: false, error: String(error.message || error) }, { status: 500 })
    }

    // Attempt to attach normalized services from `projeto_servicos` when present.
    try {
      const ids = (data || []).map((p: any) => p.id).filter(Boolean)
      if (ids.length) {
          const svcRes = await (supabaseAdmin as any).from('projeto_servicos').select('id,projeto_id,servico,orcamento_range,urgencia_level,descricao,status,responsavel_tecnico,created_at').in('projeto_id', ids)
        if (!svcRes.error) {
          const svcs = svcRes.data || []
          const map: Record<string, any[]> = {}
          svcs.forEach((s: any) => {
            if (!map[s.projeto_id]) map[s.projeto_id] = []
            map[s.projeto_id].push({ id: s.id, service: s.servico, budget: s.orcamento_range, urgency: s.urgencia_level, description: s.descricao, status: s.status, responsavel_tecnico: s.responsavel_tecnico, created_at: s.created_at })
          })
          // attach services array and keep backward-compatible fields for older consumers
          const enhanced = (data || []).map((p: any) => ({ ...p, services: map[p.id] || [], service: p.service, user_id: (user.email && p.email && String(user.email).toLowerCase() === String(p.email).toLowerCase()) ? String(user.id) : p.user_id }))
          return NextResponse.json({ ok: true, projetos: enhanced })
        }
      }
    } catch (e) {
      // ignore and fall back to returning raw rows
    }

    return NextResponse.json({ ok: true, projetos: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}
