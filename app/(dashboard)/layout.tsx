'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Providers } from '@/app/providers'
import {
  LayoutDashboard,
  ShoppingBag,
  Table as TableIcon,
  MonitorPlay,
  Package,
  Utensils,
  BarChart3,
  LogOut,
  Coffee,
  Motorbike,
  Users,
  Settings,
  Building2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'CASHIER', 'BARTENDER'] },
  { name: 'POS', href: '/pos', icon: ShoppingBag, roles: ['ADMIN', 'CASHIER', 'BARTENDER'] },
  { name: 'Mesas', href: '/tables', icon: TableIcon, roles: ['ADMIN', 'CASHIER', 'BARTENDER'] },
  { name: 'Cocina (KDS)', href: '/kds', icon: MonitorPlay, roles: ['ADMIN', 'BARTENDER'] },
  { name: 'Delivery', href: '/delivery', icon: Motorbike, roles: ['ADMIN', 'CASHIER', 'DRIVER'] },
  { name: 'Proveedores', href: '/providers', icon: Building2, roles: ['ADMIN', 'CASHIER'] },
  { name: 'Personal', href: '/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Inventario', href: '/inventory', icon: Package, roles: ['ADMIN'] },
  { name: 'Productos', href: '/products', icon: Utensils, roles: ['ADMIN'] },
  { name: 'Reportes', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'CASHIER'] },
  { name: 'Configuración', href: '/settings', icon: Settings, roles: ['ADMIN'] },
]

function DashboardContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState({
    pendingDeliveries: 0,
    lateDeliveries: 0,
    preparingOrders: 0,
    dirtyTables: 0,
  })

  // Estado de la sidebar: true = oculta, false = visible
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('🔍 Sidebar State:', {
      hidden: sidebarHidden,
      mobile: isMobile,
      menuOpen: mobileMenuOpen,
      width: typeof window !== 'undefined' ? window.innerWidth : 'server'
    })
  }, [sidebarHidden, isMobile, mobileMenuOpen])

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth
      const mobile = width < 1024
      console.log('🖥️ Screen size:', width, 'isMobile:', mobile)
      setIsMobile(mobile)
      // En desktop, mostrar sidebar por defecto
      if (!mobile && sidebarHidden) {
        setSidebarHidden(false)
      }
    }

    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [sidebarHidden])

  // Redireccionar si no autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Cerrar menú mobile al cambiar ruta
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [deliveryRes, tablesRes] = await Promise.all([
          fetch('/api/delivery'),
          fetch('/api/tables'),
        ])

        if (deliveryRes.ok) {
          const deliveryData = await deliveryRes.json()
          const pending = deliveryData.deliveries?.filter((d: any) => d.status === 'PENDING').length || 0
          const late = deliveryData.deliveries?.filter((d: any) => {
            if (!d.estimatedTime) return false
            const minutes = (Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60)
            return minutes > d.estimatedTime && d.status !== 'DELIVERED'
          }).length || 0

          setNotifications((prev) => ({
            ...prev,
            pendingDeliveries: pending,
            lateDeliveries: late,
          }))
        }

        if (tablesRes.ok) {
          const tablesData = await tablesRes.json()
          const dirty = tablesData.tables?.filter((t: any) => t.status === 'DIRTY').length || 0
          setNotifications((prev) => ({ ...prev, dirtyTables: dirty }))
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(session.user.role)
  )

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen)
    } else {
      setSidebarHidden(!sidebarHidden)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===== HEADER ===== */}
      <header
                        className={cn(
                          'fixed top-0 right-0 z-[100] bg-white border-b-2 border-amber-500 h-16 flex items-center justify-between shadow-md transition-all duration-300',
                          // Desktop: padding según sidebar
                          !isMobile && !sidebarHidden && 'left-64 px-4',
                          !isMobile && sidebarHidden && 'left-0 px-4',
                          // Mobile: sin padding lateral
                          isMobile && 'left-0 px-4'
                        )}
                      >
        <div className="flex items-center gap-2">
          {/* Botón de menú para mobile */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-slate-100 rounded-lg"
              title="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <Coffee className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">kfe POS</h1>
            <p className="text-xs text-slate-500">Sistema de Punto de Venta</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* ===== SIDEBAR ===== */}
      {/* Overlay para mobile */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Botón flotante para mostrar sidebar cuando está oculta (solo desktop) */}
      {!isMobile && sidebarHidden && (
        <button
          onClick={toggleSidebar}
          className="fixed top-20 left-4 z-[95] bg-amber-500 text-white p-2 rounded-lg shadow-lg hover:bg-amber-600 transition-colors"
          title="Mostrar sidebar"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-[80] h-full bg-slate-900 text-white transition-all duration-300 w-64',
          // Desktop: visible u oculta
          !isMobile && !sidebarHidden && 'translate-x-0',
          !isMobile && sidebarHidden && '-translate-x-full',
          // Mobile: oculta por defecto
          isMobile && !mobileMenuOpen && '-translate-x-full',
          // Mobile: visible cuando se abre
          isMobile && mobileMenuOpen && 'translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header Sidebar con botón de colapsar */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Coffee className="h-8 w-8 text-amber-500 flex-shrink-0" />
              <h1 className="text-lg font-bold whitespace-nowrap">kfe POS</h1>
            </div>
            {/* Botón de colapsar sidebar (desktop) o cerrar (mobile) */}
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              title={isMobile ? "Cerrar menú" : "Ocultar sidebar"}
            >
              {isMobile ? <X className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Usuario */}
          <div className="p-4 border-t border-slate-800">
            <div>
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
              <p className="text-xs text-amber-500 mt-1">{session.user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          // Desktop: padding según estado
          !isMobile && !sidebarHidden && 'pl-64',
          !isMobile && sidebarHidden && 'pl-0',
          // Mobile: padding lateral para contenido
          isMobile && 'px-4',
          // Header padding
          'pt-20 pb-4'
        )}
      >
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <DashboardContent>{children}</DashboardContent>
    </Providers>
  )
}
