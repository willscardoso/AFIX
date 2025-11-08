import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'
import { getUserFromRequest } from '@/lib/auth'

type QuoteBody = {
  name?: string
  nome_projeto?: string
  email?: string
  phone?: string
  service?: string
  description?: string
  location?: string
  urgency?: string
  budget?: string
}

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured: SUPABASE_SERVICE_ROLE not set' }, { status: 500 })
  }

  try {
    const body: QuoteBody = await req.json()
    // If the user is authenticated, force the project email to be the user's email
    const authUser = await getUserFromRequest(req)
    const emailFromUser = authUser?.email ? String(authUser.email).trim() : ''
    const emailFromBody = (body.email || '').toString().trim()
    // Always persist an email on the projeto: prefer logged-in user email; otherwise, use the provided email.
    const email = (emailFromUser || emailFromBody).toLowerCase()
    if (!email) return NextResponse.json({ ok: false, error: 'Email is required' }, { status: 400 })

    // Server-side validation: enforce reasonable max lengths
    const MAX = {
      name: 200,
      email: 254,
      phone: 50,
      service: 100,
      description: 2000,
      location: 200,
      urgency: 50,
      budget: 100
    }

    const tooLong: string[] = []
    if (body.name && String(body.name).length > MAX.name) tooLong.push('name')
    if (email.length > MAX.email) tooLong.push('email')
    if (body.phone && String(body.phone).length > MAX.phone) tooLong.push('phone')
    if (body.service && String(body.service).length > MAX.service) tooLong.push('service')
    if (body.description && String(body.description).length > MAX.description) tooLong.push('description')
    if (body.location && String(body.location).length > MAX.location) tooLong.push('location')
    if (body.urgency && String(body.urgency).length > MAX.urgency) tooLong.push('urgency')
    if (body.budget && String(body.budget).length > MAX.budget) tooLong.push('budget')
    if (tooLong.length) {
      return NextResponse.json({ ok: false, error: 'Fields too long', fields: tooLong }, { status: 400 })
    }

    // Schema requires email (NOT NULL). If current DB instance removed it, this will error clearly.
    // If authenticated client, treat body.nome_projeto (or body.name) as project name, and keep full_name from user
  const roleLower = String(authUser?.role || '').toLowerCase()
  // Nome do projeto vem apenas de body.nome_projeto
  const projectName = body.nome_projeto ? String(body.nome_projeto).trim() : null
  // full_name deve ser o nome do utilizador autenticado; se não autenticado, podemos guardar null (não usar nome do projeto)
  const fullNameValue = authUser?.full_name ? String(authUser.full_name).trim() : null
    const insertObj: any = {
      full_name: fullNameValue,
      email,
      phone: body.phone || null,
      service: body.service || null,
      description: body.description || null,
      location: body.location || null,
      urgency: body.urgency || null,
      budget: body.budget || null,
      status: 'pendente'
    }
    if (projectName) insertObj.nome_projeto = projectName

    // Inserir projeto (colunas conforme estrutura atual: id, full_name, service, description, location, urgency, budget, status, created_at, nome_projeto, localizacao, responsavel_tecnico, data_inicio_prevista, prazo_execucao_meses, email)
    // Selecionamos apenas o mínimo necessário + email para debug
    let resInsert = await (supabaseAdmin as any)
      .from('projetos')
      .insert(insertObj)
      .select('id, created_at, email, nome_projeto, full_name, status')
      .maybeSingle()

    let projetoData: any = null
    if (resInsert.error) {
      const msg = String(resInsert.error.message || '')
      // Fallback: if schema mismatch (missing column or cache mismatch), retry without email/phone.
      if (/could not find|schema cache|does not exist|column/i.test(msg)) {
        const fallbackInsert: any = {
          full_name: fullNameValue,
          service: body.service || null,
          description: body.description || null,
          location: body.location || null,
          urgency: body.urgency || null,
          budget: body.budget || null,
          status: 'pendente'
        }
        if (projectName) fallbackInsert.nome_projeto = projectName
        const res2 = await (supabaseAdmin as any)
          .from('projetos')
          .insert(fallbackInsert)
          .select('id,created_at')
          .maybeSingle()
        if (res2.error) {
          return NextResponse.json({ ok: false, error: String(res2.error.message || res2.error) }, { status: 500 })
        }
        projetoData = res2.data
      } else {
        // Real error not handled by fallback
        return NextResponse.json({ ok: false, error: msg }, { status: 500 })
      }
    }
    if (!projetoData) projetoData = resInsert.data

    // Ensure the email column is set for the created project even if we had to use a fallback insert
    try {
      if (projetoData?.id && email) {
        await (supabaseAdmin as any)
          .from('projetos')
          .update({ email })
          .eq('id', projetoData.id)
      }
    } catch (_) {}

    // Ensure a user exists for linkage: if authenticated user missing (token invalid) but an email was provided, create user row.
    // Then link projeto -> user in projeto_users.
    let linkageDebug: any = undefined
    try {
      // Regra: associar somente se existir user com este email.
      const existingUserRes = await (supabaseAdmin as any)
        .from('users')
        .select('id, role_id, email')
        .ilike('email', email)
        .limit(1)
        .maybeSingle()
      linkageDebug = {
        lookupError: existingUserRes.error ? String(existingUserRes.error.message || existingUserRes.error) : null,
        foundUser: existingUserRes.data ? { id: existingUserRes.data.id, email: existingUserRes.data.email, role_id: existingUserRes.data.role_id } : null
      }
      const existingUser = (!existingUserRes.error && existingUserRes.data) ? existingUserRes.data : null
      if (existingUser && existingUser.id && projetoData?.id) {
        const roleId = (existingUser as any).role_id ?? null
        const record: any = { projeto_id: String(projetoData.id), user_id: String(existingUser.id) }
        if (roleId !== null) record.role_id = roleId
        const linkRes = await (supabaseAdmin as any)
          .from('projeto_users')
          .upsert(record, { onConflict: 'projeto_id,user_id', ignoreDuplicates: true })
        linkageDebug.linkAttempt = { record, error: linkRes.error ? String(linkRes.error.message || linkRes.error) : null }
        if (linkRes.error) {
          // Se o upsert falhar por ausência de UNIQUE/ON CONFLICT válido ou qualquer outro motivo,
          // tentamos um insert simples e ignoramos conflito 23505 (duplicado)
          try {
            const ins = await (supabaseAdmin as any).from('projeto_users').insert(record)
            linkageDebug.fallbackInsert = { error: ins.error ? String(ins.error.message || ins.error) : null, code: (ins as any)?.error?.code || null }
          } catch (e:any) {
            linkageDebug.fallbackInsert = { thrown: e?.message || String(e) }
          }
        }
        // Verificação final: ler a ligação
        try {
          const check = await (supabaseAdmin as any)
            .from('projeto_users')
            .select('id')
            .eq('projeto_id', String(projetoData.id))
            .eq('user_id', String(existingUser.id))
            .limit(1)
          linkageDebug.postCheck = { found: Array.isArray(check.data) && check.data.length > 0, error: check.error ? String(check.error.message || check.error) : null }
        } catch (e:any) {
          linkageDebug.postCheck = { thrown: e?.message || String(e) }
        }
      } else {
        linkageDebug.skipped = true
      }
    } catch (e:any) {
      linkageDebug = { thrown: e?.message || String(e) }
    }

    // Optionally create a normalized service row if table exists
    try {
      if (projetoData?.id && (body.service || body.description || body.urgency || body.budget)) {
        await (supabaseAdmin as any)
          .from('projeto_servicos')
          .insert({
            projeto_id: String(projetoData.id),
            servico: body.service || null,
            descricao: body.description || null,
            urgencia_level: body.urgency || null,
            orcamento_range: body.budget || null,
            status: 'pendente'
          })
      }
    } catch (_) {}

  // Optional debug: append linkage info when ?debug=1 is present
  const url = new URL(req.url)
  const debug = url.searchParams.get('debug') === '1'
  if (debug) {
    try {
      const links = await (supabaseAdmin as any)
        .from('projeto_users')
        .select('id,projeto_id,user_id,role_id,created_at')
        .eq('projeto_id', projetoData?.id || '')
      return NextResponse.json({ ok: true, projeto: projetoData, debug: { email, linkage: linkageDebug, links: links?.data || null, linkError: links?.error || null } })
    } catch (e: any) {
      return NextResponse.json({ ok: true, projeto: projetoData, debug: { email, linkage: linkageDebug, error: e?.message ?? String(e) } })
    }
  }

  return NextResponse.json({ ok: true, projeto: projetoData })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}
