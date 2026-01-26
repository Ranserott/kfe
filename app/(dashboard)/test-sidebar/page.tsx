'use client'

import { useState, useEffect } from 'react'

export default function TestSidebarPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Test de Sidebar</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Estado Actual</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-100 p-4 rounded">
              <p className="text-sm text-slate-600">isMobile</p>
              <p className="text-2xl font-bold">{isMobile ? 'SÍ' : 'NO'}</p>
            </div>
            <div className="bg-slate-100 p-4 rounded">
              <p className="text-sm text-slate-600">sidebarCollapsed</p>
              <p className="text-2xl font-bold">{sidebarCollapsed ? 'SÍ' : 'NO'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Botones de Prueba</h2>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">1. Botón del Header Desktop (como en el layout):</p>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-300"
              title="Colapsar/Expandir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">2. Botón Naranja del Sidebar (como en el layout):</p>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="bg-amber-600 text-white rounded-full p-2 hover:bg-amber-700 transition-all hover:scale-110 shadow-lg border-2 border-amber-400"
              title="Colapsar/Expandir Sidebar"
            >
              {sidebarCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">3. Botón de Texto Claro:</p>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {sidebarCollapsed ? 'Expandir Sidebar' : 'Colapsar Sidebar'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Simulación de Sidebar</h2>
          <div className="flex gap-4">
            <div
              className={`bg-slate-900 text-white transition-all duration-300 ${
                sidebarCollapsed ? 'w-20' : 'w-64'
              }`}
              style={{ minHeight: '200px' }}
            >
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-600">
                  <span className="text-xl">☕</span>
                  {!sidebarCollapsed && <span>Dashboard</span>}
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800">
                  <span className="text-xl">🛒</span>
                  {!sidebarCollapsed && <span>POS</span>}
                </div>
              </div>

              {!isMobile && (
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="absolute bg-amber-600 text-white rounded-full p-2 hover:bg-amber-700 transition-all hover:scale-110"
                  style={{
                    right: '-16px',
                    top: '96px',
                    border: '2px solid #fbbf24',
                  }}
                >
                  {sidebarCollapsed ? '→' : '←'}
                </button>
              )}
            </div>

            <div className="flex-1 bg-white border-2 border-dashed border-slate-300 rounded-lg p-4">
              <p className="text-slate-600">Contenido Principal</p>
              <p className="text-sm text-slate-500 mt-2">
                El padding izquierdo debería ajustarse según el estado de la sidebar
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-2">Instrucciones:</h3>
          <ol className="list-decimal list-inside space-y-1 text-amber-800">
            <li>Prueba cada uno de los botones de arriba</li>
            <li>Observa cómo cambia el estado "sidebarCollapsed"</li>
            <li>Ver la simulación de la sidebar abajo</li>
            <li>Ajusta el tamaño de la ventana para probar responsive</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
