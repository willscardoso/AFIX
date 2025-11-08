import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    // Ensure phone and created_at are included if stored but not returned by helper
    let enriched = user
    if (user && !('phone' in user) && supabaseAdmin) {
      try {
        const { data } = await (supabaseAdmin as any).from('users').select('phone, created_at').eq('id', user.id).maybeSingle()
        if (data) {
          enriched = { ...user, phone: data.phone, created_at: data.created_at }
        }
      } catch (e) {
        /* ignore */
      }
    }
    return NextResponse.json({ ok: true, user: enriched })
  } catch (err: any) {
    // log server-side for easier debugging
    // eslint-disable-next-line no-console
    console.error('Error in /api/auth/me:', err && err.message ? err.message : String(err))
    const payload: any = { ok: false, error: 'Server error' }
    if (process.env.NODE_ENV !== 'production') payload.debug = err && err.message ? err.message : String(err)
    return NextResponse.json(payload, { status: 500 })
  }
}
