import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 })
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const role = String((user.role || '')).toLowerCase()
    if (!['franqueador','franqueado','admin'].includes(role)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const id = String(new URL(req.url).pathname.split('/').filter(Boolean).slice(-2, -1)[0] || params.id || '')
    if (!id) return NextResponse.json({ ok: false, error: 'Invalid project id' }, { status: 400 })

    // Fetch current project to check assignment
    const existing = await (supabaseAdmin as any).from('projetos').select('id,responsavel_tecnico').eq('id', id).maybeSingle()
    if ((existing as any).error) return NextResponse.json({ ok: false, error: String((existing as any).error.message || (existing as any).error) }, { status: 500 })
    const proj = (existing as any).data
    if (!proj) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const displayName = String(user.full_name || user.name || user.email || user.id)

    // If already assigned to someone else, do not override silently
    if (proj.responsavel_tecnico && String(proj.responsavel_tecnico).trim().length > 0 && String(proj.responsavel_tecnico) !== displayName) {
      return NextResponse.json({ ok: false, error: 'Projeto já atribuído a outro responsável técnico' }, { status: 409 })
    }

    // Assign responsible technician and, if status is 'pendente', set to 'respondido'
    const upd = await (supabaseAdmin as any)
      .from('projetos')
      .update({ responsavel_tecnico: displayName })
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (upd.error) return NextResponse.json({ ok: false, error: String(upd.error.message || upd.error) }, { status: 500 })

    // best-effort: bump status to 'respondido' if it was 'pendente'
    try {
      const projStatus = (upd.data as any)?.status
      if (projStatus === 'pendente') {
        await (supabaseAdmin as any).from('projetos').update({ status: 'respondido' }).eq('id', id)
      }
    } catch {}

    // Try to link user to project for ownership in future updates
    try {
      const link = await (supabaseAdmin as any).from('projeto_users').select('id').eq('projeto_id', id).eq('user_id', String(user.id)).maybeSingle()
      if (link.error) {
        // if table missing or other error, ignore
      } else if (!link.data) {
        await (supabaseAdmin as any).from('projeto_users').insert({ projeto_id: id, user_id: String(user.id) })
      }
    } catch (e) {
      // ignore linking errors gracefully
    }

    // Optionally attach services
    try {
      const svcRes = await (supabaseAdmin as any).from('projeto_servicos').select('id,servico,descricao,orcamento_range,urgencia_level,created_at').eq('projeto_id', id)
      if (!svcRes.error) {
        const services = (svcRes.data || []).map((s: any) => ({ id: s.id, service: s.servico, description: s.descricao, budget: s.orcamento_range, urgency: s.urgencia_level, created_at: s.created_at }))
        return NextResponse.json({ ok: true, projeto: { ...(upd.data || {}), services } })
      }
    } catch {}

    return NextResponse.json({ ok: true, projeto: upd.data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}
