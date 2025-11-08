"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Globe, Menu, X, Users } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

export default function SiteHeader() {
  const { language, toggleLanguage } = useLanguage()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!mounted) return
      if (d?.ok && d.user) setCurrentUser(d.user)
    }).catch(()=>{})
    // mark mounted on client to avoid hydration mismatches
    setIsMounted(true)
    return () => { mounted = false }
  }, [])

  const t = {
    pt: { nav: { home: 'Início', quote: 'Pedir Orçamento', franchise: 'Franquia', dashboard: 'Dashboard', chat: 'Rede Franquiados' } },
    en: { nav: { home: 'Home', quote: 'Request Quote', franchise: 'Franchise', dashboard: 'Dashboard', chat: 'Franchise Network' } }
  }

  const currentLang = t[language]

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">AFIX</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {(() => {
              // Role-based nav filtering
              const role = String(currentUser?.role || '').toLowerCase()
              const allowedForCliente = ['home', 'quote']
              // Hide dashboard for franqueado
              const allowedForFranqueado = ['home', 'franchise', 'chat']
              const allowedForFranqueador = ['home', 'franchise', 'chat'] // no dashboard for franqueador
              const allowedForAdmin = ['home', 'dashboard']
              const entries = Object.entries(currentLang.nav).filter(([k]) => {
                // dashboard must be shown only to logged users
                if (k === 'dashboard' && !currentUser) return false
                if (role === 'admin') return allowedForAdmin.includes(k)
                if (role === 'cliente') return allowedForCliente.includes(k)
                if (role === 'franqueado') return allowedForFranqueado.includes(k)
                if (role === 'franqueador') return allowedForFranqueador.includes(k)
                return true
              })

              const to = (k: string) => {
                switch (k) {
                  case 'home': return '/'
                  case 'quote': return '/quote'
                  case 'franchise': return '/?tab=franchise'
                  case 'dashboard': return '/banca'
                  case 'chat': return '/?tab=chat'
                  default: return '/'
                }
              }

              return entries.map(([key, label]) => (
                <button key={key} onClick={() => router.push(to(key)) } className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">{label}</button>
              ))
            })()}

            {/* Auth controls (login/logout) */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <button onClick={() => router.push('/account')} className="flex items-center space-x-2 text-gray-700">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div className="text-sm font-medium">{currentUser.full_name || currentUser.email}</div>
                </button>
                <button onClick={async () => { try { await fetch('/api/auth/logout', { method: 'POST' }) } catch(e){}; setCurrentUser(null); try { window.dispatchEvent(new CustomEvent('afix:logout')) } catch(e){}; router.push('/') }} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">Logout</button>
              </div>
            ) : (
              <button onClick={() => router.push('/login')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">Login</button>
            )}

            {/* language toggle immediately after auth */}
            <button onClick={toggleLanguage} className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
              <Globe className="h-4 w-4 mr-1" /> {language.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* mobile menu button - visible only on small screens */}
      {isMounted && (
        <div className="md:hidden absolute right-4 top-4">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-700 hover:text-blue-600">{mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
      )}

      {isMounted && mobileOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {(() => {
              const role = String(currentUser?.role || '').toLowerCase()
              const allowedForCliente = ['home', 'quote']
              // Hide dashboard for franqueado
              const allowedForFranqueado = ['home', 'franchise', 'chat']
              const allowedForFranqueador = ['home', 'franchise', 'chat']
              const allowedForAdmin = ['home', 'dashboard']
              const entries = Object.entries(currentLang.nav).filter(([k]) => {
                // dashboard must be shown only to logged users
                if (k === 'dashboard' && !currentUser) return false
                if (role === 'admin') return allowedForAdmin.includes(k)
                if (role === 'cliente') return allowedForCliente.includes(k)
                if (role === 'franqueado') return allowedForFranqueado.includes(k)
                if (role === 'franqueador') return allowedForFranqueador.includes(k)
                return true
              })

              const to = (k: string) => {
                switch (k) {
                  case 'home': return '/'
                  case 'quote': return '/quote'
                  case 'franchise': return '/?tab=franchise'
                  case 'dashboard': return '/banca'
                  case 'chat': return '/?tab=chat'
                  default: return '/'
                }
              }

              return entries.map(([key, label]) => (
                <button key={key} onClick={() => { setMobileOpen(false); router.push(to(key)) }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600">{label}</button>
              ))
            })()}

            {/* Auth block for mobile: name + logout OR login */}
            {currentUser ? (
              <div className="px-3 py-2 space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700"><Users className="h-5 w-5 text-gray-600" />{currentUser.full_name || currentUser.email}</div>
                <button onClick={async () => { try { await fetch('/api/auth/logout', { method: 'POST' }) } catch(e){}; setMobileOpen(false); setCurrentUser(null); try { window.dispatchEvent(new CustomEvent('afix:logout')) } catch(e){}; router.push('/') }} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600">Logout</button>
              </div>
            ) : (
              <button onClick={() => { setMobileOpen(false); router.push('/login') }} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600">Login</button>
            )}

            {/* language toggle placed immediately after auth */}
            <button onClick={() => { setMobileOpen(false); toggleLanguage() }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600">{language.toUpperCase()}</button>
          </div>
        </div>
      )}
    </nav>
  )
}
