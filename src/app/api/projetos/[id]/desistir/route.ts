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

    const existing = await (supabaseAdmin as any).from('projetos').select('id,responsavel_tecnico').eq('id', id).maybeSingle()
    if ((existing as any).error) return NextResponse.json({ ok: false, error: String((existing as any).error.message || (existing as any).error) }, { status: 500 })
    const proj = (existing as any).data
    if (!proj) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const displayName = String(user.full_name || user.name || user.email || user.id)
    if (!proj.responsavel_tecnico) {
      return NextResponse.json({ ok: false, error: 'Nenhum responsável técnico atribuído' }, { status: 409 })
    }
    if (String(proj.responsavel_tecnico) !== displayName && role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Não é o responsável técnico atual' }, { status: 403 })
    }

  const upd = await (supabaseAdmin as any).from('projetos').update({ responsavel_tecnico: null }).eq('id', id).select('*').maybeSingle()
    if (upd.error) return NextResponse.json({ ok: false, error: String(upd.error.message || upd.error) }, { status: 500 })

    // no status auto-change on desistir; keep existing status
    return NextResponse.json({ ok: true, projeto: upd.data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}
