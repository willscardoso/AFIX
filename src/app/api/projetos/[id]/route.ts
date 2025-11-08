import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 })
  try {
    // In some Next.js runtimes `params` can be a promise-like value; avoid that by
    // extracting the dynamic id directly from the request URL.
    const id = String(new URL(req.url).pathname.split('/').filter(Boolean).pop() || '')
    const { data, error } = await supabaseAdmin.from('projetos').select('*').eq('id', id).maybeSingle()
    if (error) return NextResponse.json({ ok: false, error: String(error.message || error) }, { status: 500 })
    if (!data) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const proj: any = data

    // try to attach normalized services from projeto_servicos; fall back to legacy service field
    try {
      const svcRes = await supabaseAdmin.from('projeto_servicos').select('id,servico,descricao,orcamento_range,urgencia_level,created_at').eq('projeto_id', id)
      if (!svcRes.error) {
        const services = (svcRes.data || []).map((s: any) => ({ id: s.id, service: s.servico, description: s.descricao, budget: s.orcamento_range, urgency: s.urgencia_level, created_at: s.created_at }))
        return NextResponse.json({ ok: true, projeto: { ...proj, services } })
      }
    } catch (e) {
      // ignore and fall back
    }

    // fallback: try to parse legacy JSON-service or return single-item service
    try {
      let services: any[] = []
      if (proj.service) {
        try {
          const parsed = JSON.parse(proj.service)
          if (Array.isArray(parsed)) services = parsed
          else services = [{ service: proj.service, description: proj.description, budget: proj.budget, urgency: proj.urgency }]
        } catch (e) {
          services = [{ service: proj.service, description: proj.description, budget: proj.budget, urgency: proj.urgency }]
        }
      }
      return NextResponse.json({ ok: true, projeto: { ...proj, services } })
    } catch (e) {
      return NextResponse.json({ ok: true, projeto: proj })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}
