import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import supabaseAdmin from '@/lib/supabaseAdmin'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 })

    const body = await req.json()
    const updates: any = {}
    if (body.full_name != null) updates.full_name = String(body.full_name).trim()
    if (body.email != null) updates.email = String(body.email).trim().toLowerCase()
    if (body.phone != null) updates.phone = String(body.phone).trim()

    // If password provided, hash it and update password_hash
    if (body.password && String(body.password).length > 0) {
      const hash = await bcrypt.hash(String(body.password), 12)
      updates.password_hash = hash
    }

    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 })

  const { data, error } = await (supabaseAdmin as any).from('users').update(updates).eq('id', user.id).select('id,email,full_name,phone').maybeSingle()
    if (error) return NextResponse.json({ ok: false, error: String(error.message || error) }, { status: 500 })

    return NextResponse.json({ ok: true, user: data })
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/me/user PUT:', err && err.message ? err.message : String(err))
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
