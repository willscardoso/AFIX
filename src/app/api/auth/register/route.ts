import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import supabaseAdmin from '@/lib/supabaseAdmin'

type RegisterBody = {
  email?: string
  password?: string
  full_name?: string
  role?: string
}

export async function POST(req: Request) {
  try {
    const body: RegisterBody = await req.json()
    let { email, password, full_name, role } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ ok: false, error: 'full_name, email and password are required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      if (process.env.NODE_ENV !== 'production') console.warn('Auth debug: supabaseAdmin not configured')
      return NextResponse.json({ ok: false, error: 'Server misconfigured: missing SUPABASE_SERVICE_ROLE or NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    }

    email = String(email).trim().toLowerCase()
    password = String(password)
    full_name = String(full_name).trim()

    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check existing user by email (case-insensitive)
    const { data: existing, error: existingErr } = await (supabaseAdmin as any)
      .from('users')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle()

    if (existingErr) {
      console.warn('Supabase lookup error', existingErr.message)
      return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ ok: false, error: 'User already exists' }, { status: 409 })
    }

    // Resolve role_id from roles table if provided, otherwise default to 'cliente'
    const roleName = role ? String(role).trim().toLowerCase() : 'cliente'
    let role_id: number | null = null
    try {
      const rr = await (supabaseAdmin as any).from('roles').select('role_id, name').ilike('name', roleName).limit(1).maybeSingle()
      if (rr && (rr as any).data && (rr as any).data.role_id != null) {
        role_id = (rr as any).data.role_id
      }
    } catch (e) {
      // ignore and continue without role_id
    }

    const hash = await bcrypt.hash(password, 10)

    const insertObj: any = { email, password_hash: hash, full_name }
    if (role_id != null) insertObj.role_id = role_id

    const { data: inserted, error: insertErr } = await (supabaseAdmin as any)
      .from('users')
      .insert(insertObj)
      .select('id, email, role_id')
      .maybeSingle()

    if (insertErr) {
      console.warn('Supabase insert error', insertErr.message)
      return NextResponse.json({ ok: false, error: 'Failed to create user' }, { status: 500 })
    }

    // If role is cliente (or unspecified so defaulted to cliente), associate existing projetos by email
    try {
      // Determine if user is client-like
      let isCliente = false
      if (roleName === 'cliente' || roleName === 'client') {
        isCliente = true
      } else if (inserted?.role_id != null) {
        try {
          const r = await (supabaseAdmin as any).from('roles').select('name').eq('role_id', inserted.role_id).limit(1).maybeSingle()
          if (!r.error && r.data && r.data.name) {
            const nm = String(r.data.name).toLowerCase()
            isCliente = (nm === 'cliente' || nm === 'client')
          }
        } catch {}
      }

      if (isCliente) {
        // Find projetos with same email
        const projRes = await (supabaseAdmin as any)
          .from('projetos')
          .select('id,email')
          .ilike('email', email)
          .limit(1000)
        if (!projRes.error && Array.isArray(projRes.data) && projRes.data.length) {
          const records = projRes.data
            .filter((p: any) => p && p.id)
            .map((p: any) => ({ projeto_id: String(p.id), user_id: String(inserted.id), role_id: inserted.role_id ?? null }))
          if (records.length) {
            const up = await (supabaseAdmin as any)
              .from('projeto_users')
              .upsert(records, { onConflict: 'projeto_id,user_id', ignoreDuplicates: true })
            if (up.error) {
              // Fallback to insert batch
              try { await (supabaseAdmin as any).from('projeto_users').insert(records) } catch {}
            }
          }
        }
      }
    } catch (e) {
      // ignore association errors
    }

    return NextResponse.json({ ok: true, user: inserted })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message ?? String(err) }, { status: 500 })
  }
}
