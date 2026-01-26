'use client'

import { useEffect, useState } from 'react'

export default function TestSidebarSimplePage() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test de Sidebar - kfe POS</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Información de Ventana</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-slate-600">Ancho de ventana</p>
              <p className="text-2xl font-bold text-blue-600">{windowSize.width}px</p>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-slate-600">Alto de ventana</p>
              <p className="text-2xl font-bold text-blue-600">{windowSize.height}px</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-green-50 rounded">
            <p className="text-sm text-slate-600">Modo detectado:</p>
            <p className="text-xl font-bold text-green-600">
              {windowSize.width < 1024 ? '📱 MOBILE' : '🖥️ DESKTOP'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test de Sidebar</h2>

          {/* Simulación de sidebar desktop */}
          {windowSize.width >= 1024 && (
            <div className="flex gap-4">
              <div className="bg-slate-900 text-white w-64 rounded-lg p-4">
                <p className="font-bold mb-4">☕ kfe POS</p>
                <div className="space-y-2">
                  <div className="bg-amber-600 px-3 py-2 rounded">📊 Dashboard</div>
                  <div className="hover:bg-slate-800 px-3 py-2 rounded">🛒 POS</div>
                  <div className="hover:bg-slate-800 px-3 py-2 rounded">🪑 Mesas</div>
                  <div className="hover:bg-slate-800 px-3 py-2 rounded">👨‍🍳 Cocina</div>
                </div>
                <p className="text-xs text-slate-400 mt-4">Ancho: 256px (expandida)</p>
              </div>

              <div className="flex-1">
                <p className="text-slate-700">Esta es una simulación de cómo debería verse la sidebar en desktop.</p>
                <p className="text-sm text-slate-500 mt-2">La sidebar real debería estar visible a la izquierda de la pantalla.</p>
              </div>
            </div>
          )}

          {/* Simulación de sidebar mobile */}
          {windowSize.width < 1024 && (
            <div>
              <div className="bg-slate-900 text-white p-4 rounded-lg mb-4">
                <p className="font-bold">☕ kfe POS - Header Mobile</p>
                <p className="text-xs text-slate-400">Botón ☰ para abrir menú</p>
              </div>
              <p className="text-slate-700">En móvil, la sidebar debería estar oculta y deslizar desde la izquierda al presionar ☰.</p>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-2">🔍 Pasos para verificar:</h3>
          <ol className="list-decimal list-inside space-y-2 text-amber-800">
            <li>Ajusta el tamaño de tu ventana para ver si cambia entre mobile y desktop</li>
            <li>Si estás en desktop (ancho ≥ 1024px), deberías ver una sidebar negra a la izquierda</li>
            <li>Si NO ves la sidebar, hay un problema con el código o el navegador</li>
            <li>Abre la consola del navegador (F12) y busca "Sidebar Debug"</li>
          </ol>
        </div>

        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-2">❓ ¿No ves la sidebar en la app principal?</h3>
          <p className="text-red-800 mb-4">Si no ves la sidebar cuando navegas a otras páginas, intenta estos pasos:</p>
          <ol className="list-decimal list-inside space-y-2 text-red-700">
            <li>Ve a <a href="/" className="underline font-bold">http://localhost:3000</a></li>
            <li>Presiona <strong>F12</strong> para abrir las herramientas de desarrollador</li>
            <li>Ve a la pestaña <strong>Console</strong></li>
            <li>Presiona <strong>Cmd+Shift+R</strong> (Mac) o <strong>Ctrl+Shift+R</strong> (Windows) para recargar sin caché</li>
            <li>Busca mensajes que digan "Sidebar Debug"</li>
            <li>Si ves el mensaje, la sidebar debería estar visible</li>
          </ol>
        </div>

        <div className="mt-6 flex gap-4">
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir al Dashboard
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Ir a Dashboard (directo)
          </a>
        </div>
      </div>
    </div>
  )
}
