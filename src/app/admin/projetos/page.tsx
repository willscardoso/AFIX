import supabaseAdmin from '@/lib/supabaseAdmin'
import React from 'react'

export const revalidate = 0

export default async function ProjetosAdminPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Not available in production</h1>
      </div>
    )
  }

  if (!supabaseAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Supabase admin client not configured</h1>
      </div>
    )
  }

  const { data, error } = await supabaseAdmin.from('projetos').select('id,full_name,service,description,location,urgency,budget,status,created_at').order('created_at', { ascending: false }).limit(200)

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Error fetching projetos</h1>
        <pre className="mt-4 text-sm text-red-600">{String(error.message ?? error)}</pre>
      </div>
    )
  }

  const rows = data || []

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Projetos (dev)</h1>
      <div className="overflow-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Serviço</th>
              <th className="p-2 text-left">Localização</th>
              <th className="p-2 text-left">Urgência</th>
              <th className="p-2 text-left">Budget</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Criado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 text-sm text-gray-700">{r.id}</td>
                <td className="p-2 text-sm text-gray-700">{r.full_name}</td>
                {/* email/phone columns removed from projeto schema */}
                <td className="p-2 text-sm text-gray-700">{r.service}</td>
                <td className="p-2 text-sm text-gray-700">{r.location}</td>
                <td className="p-2 text-sm text-gray-700">{r.urgency}</td>
                <td className="p-2 text-sm text-gray-700">{r.budget}</td>
                <td className="p-2 text-sm text-gray-700">{r.status}</td>
                <td className="p-2 text-sm text-gray-700">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
