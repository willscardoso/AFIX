"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/hooks/useLanguage'

export default function AccountPage() {
  const { toast } = useToast()
  const { language } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({ email: '', phone: '', password: '', passwordConfirm: '', full_name: '' })

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!mounted) return
      if (d?.ok && d.user) {
        setUser(d.user)
        setForm({ email: d.user.email || '', phone: d.user.phone || '', password: '', passwordConfirm: '', full_name: d.user.full_name || '' })
      }
    }).catch(() => {})
    .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (form.password && form.password !== form.passwordConfirm) {
      toast({ title: 'Erro', description: 'As passwords não coincidem' })
      return
    }
    setSaving(true)
    try {
      const payload: any = { full_name: form.full_name, email: form.email, phone: form.phone }
      if (form.password) payload.password = form.password
      const res = await fetch('/api/me/user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed')
      toast({ title: language === 'pt' ? 'Guardado' : 'Saved', description: language === 'pt' ? 'Perfil atualizado' : 'Profile updated' })
      // refresh local user info
      setUser(data.user)
      setForm(f => ({ ...f, password: '', passwordConfirm: '' }))
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message ?? String(err) })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">A carregar...</div>
  if (!user) return <div className="p-6">Utilizador não encontrado</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-semibold mb-6">{language === 'pt' ? 'Minha Conta' : 'My Account'}</h1>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'pt' ? 'Nome' : 'Full name'}</label>
              <input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'pt' ? 'Telemóvel' : 'Phone'}</label>
              <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} type="tel" className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'pt' ? 'Nova Password' : 'New password'}</label>
              <input value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} type="password" className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'pt' ? 'Confirmar Password' : 'Confirm password'}</label>
              <input value={form.passwordConfirm} onChange={(e) => setForm(f => ({ ...f, passwordConfirm: e.target.value }))} type="password" className="w-full border px-3 py-2 rounded" />
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex items-center space-x-3">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? (language === 'pt' ? 'A gravar...' : 'Saving...') : (language === 'pt' ? 'Guardar' : 'Save')}</button>
              <button type="button" onClick={() => router.push('/?tab=dashboard')} className="text-sm text-gray-600">{language === 'pt' ? 'Cancelar' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
