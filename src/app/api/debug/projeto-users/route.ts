import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

// GET /api/debug/projeto-users?projeto_id=...&user_id=...&email=...
// Utility endpoint to quickly check links present in projeto_users
export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Missing supabase' }, { status: 500 })
  }
  try {
    const url = new URL(req.url)
    const projetoId = url.searchParams.get('projeto_id') || undefined
    const userId = url.searchParams.get('user_id') || undefined
    const email = (url.searchParams.get('email') || '').toLowerCase() || undefined

    let ids: string[] = []
    if (email) {
      const u = await (supabaseAdmin as any)
        .from('users')
        .select('id,email')
        .ilike('email', email)
        .maybeSingle()
      if (!u.error && u.data?.id) ids.push(String(u.data.id))
    }
    if (userId) ids.push(String(userId))
    ids = Array.from(new Set(ids))

    let q = (supabaseAdmin as any).from('projeto_users').select('*')
    if (projetoId) q = q.eq('projeto_id', String(projetoId))
    if (ids.length) q = q.in('user_id', ids)
    const { data, error } = await q
    if (error) return NextResponse.json({ ok: false, error: String(error.message || error) }, { status: 500 })
    return NextResponse.json({ ok: true, links: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}
