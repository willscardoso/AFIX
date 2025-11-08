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

    const svcRes = await (supabaseAdmin as any).from('projeto_servicos').select('id,status,responsavel_tecnico').eq('id', id).maybeSingle()
    if (svcRes.error) return NextResponse.json({ ok: false, error: String(svcRes.error.message || svcRes.error) }, { status: 500 })
    const svc = svcRes.data
    if (!svc) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const displayName = String(user.full_name || (user as any).name || user.email || user.id)
    // Only the same responsible (or admin) can unclaim to avoid race conditions
    const userRole = String(user.role || '').toLowerCase()
    if (svc.responsavel_tecnico && svc.responsavel_tecnico !== displayName && !['admin'].includes(userRole)) {
      return NextResponse.json({ ok: false, error: 'Não pode desistir: outro responsável definido' }, { status: 403 })
    }

    const newStatus = 'pendente'
    const upd = await (supabaseAdmin as any).from('projeto_servicos').update({ status: newStatus, responsavel_tecnico: null }).eq('id', id).select('*').maybeSingle()
    if (upd.error) return NextResponse.json({ ok: false, error: String(upd.error.message || upd.error) }, { status: 500 })

    return NextResponse.json({ ok: true, servico: upd.data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 })
  }
}
