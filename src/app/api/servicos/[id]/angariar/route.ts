import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 })
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    const role = String(user.role || '').toLowerCase()
    if (!['franqueador','franqueado','admin'].includes(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const id = params.id
    if (!id) return NextResponse.json({ ok: false, error: 'Invalid service id' }, { status: 400 })

    // fetch service and related project
    const svcRes = await (supabaseAdmin as any).from('projeto_servicos').select('id,projeto_id,status,responsavel_tecnico').eq('id', id).maybeSingle()
    if (svcRes.error) return NextResponse.json({ ok: false, error: String(svcRes.error.message || svcRes.error) }, { status: 500 })
    const svc = svcRes.data
    if (!svc) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const displayName = String(user.full_name || (user as any).name || user.email || user.id)
    // If already assigned to someone else, do not override silently
    if (svc.responsavel_tecnico && String(svc.responsavel_tecnico) !== displayName) {
      return NextResponse.json({ ok: false, error: 'Serviço já atribuído a outro responsável técnico' }, { status: 409 })
    }

    // claim service: if status pendente -> respondido, else keep
    const newStatus = svc.status === 'pendente' ? 'respondido' : svc.status
    const upd = await (supabaseAdmin as any).from('projeto_servicos').update({ status: newStatus, responsavel_tecnico: displayName }).eq('id', id).select('*').maybeSingle()
    if (upd.error) return NextResponse.json({ ok: false, error: String(upd.error.message || upd.error) }, { status: 500 })

    return NextResponse.json({ ok: true, servico: upd.data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 })
  }
}
