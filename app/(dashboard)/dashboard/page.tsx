'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Clock,
  ChefHat,
  Motorbike,
  Utensils,
  Store,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react'
import { startOfDay, subDays, format } from 'date-fns'

interface AnalyticsData {
  summary: {
    totalRevenue: number
    totalOrders: number
    closedOrders: number
    pendingOrders: number
    avgTicket: number
    avgOrderValue: number
  }
  revenue: {
    byType: { DINE_IN: number; TAKEAWAY: number; DELIVERY: number }
    byCategory: Array<{ name: string; revenue: number }>
    peakHours: Array<{ hour: number; revenue: number }>
  }
  tables: {
    total: number
    occupied: number
    dirty: number
    free: number
  }
  inventory: {
    lowStock: number
    outOfStock: number
  }
  customers: {
    total: number
    new: number
    vip: number
  }
  delivery: {
    pending: number
    delivered: number
    avgTime: number
    onTimeRate: number
  }
  kds: {
    pending: number
    preparing: number
    ready: number
    overdue: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      const data = await res.json()
      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'Ingresos Totales',
      value: formatCurrency(analytics.summary.totalRevenue),
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600',
      trend: '+12%',
      positive: true,
    },
    {
      title: 'Órdenes',
      value: analytics.summary.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600',
      subtitle: `${analytics.summary.closedOrders} cerradas`,
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(analytics.summary.avgTicket),
      icon: Activity,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Clientes',
      value: analytics.customers.total.toString(),
      icon: Users,
      color: 'bg-amber-100 text-amber-600',
      subtitle: `${analytics.customers.new} nuevos`,
    },
  ]

  const quickActions = [
    { name: 'Nueva Orden', href: '/pos', icon: ShoppingCart, color: 'bg-amber-600' },
    { name: 'Mesas', href: '/tables', icon: Store, color: 'bg-emerald-600' },
    { name: 'Cocina', href: '/kds', icon: ChefHat, color: 'bg-blue-600' },
    { name: 'Delivery', href: '/delivery', icon: Motorbike, color: 'bg-purple-600' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Vista general del sistema</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            Actualizado hace unos segundos
          </div>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${period === p
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }
                `}
              >
                {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(analytics.inventory.lowStock > 0 || analytics.kds.overdue > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {analytics.inventory.lowStock > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Stock Bajo</p>
                    <p className="text-sm text-red-600">
                      {analytics.inventory.lowStock} productos necesitan reabastecimiento
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => router.push('/inventory')}
                  >
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {analytics.kds.overdue > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-900">Órdenes Atrasadas</p>
                    <p className="text-sm text-orange-600">
                      {analytics.kds.overdue} órdenes llevan más de 10 min
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => router.push('/kds')}
                  >
                    Ver KDS
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{kpi.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                    {kpi.subtitle && (
                      <p className="text-xs text-slate-500 mt-1">{kpi.subtitle}</p>
                    )}
                    {kpi.trend && (
                      <div className={`flex items-center gap-1 mt-2 text-sm ${
                        kpi.positive ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {kpi.positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {kpi.trend}
                      </div>
                    )}
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${kpi.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.name}
                  onClick={() => router.push(action.href)}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl text-white transition-all
                    ${action.color} hover:opacity-90 hover:shadow-lg
                  `}
                >
                  <Icon className="h-6 w-6" />
                  <span className="font-semibold">{action.name}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-emerald-600" />
                  <span>En Local</span>
                </div>
                <span className="font-bold">{formatCurrency(analytics.revenue.byType.DINE_IN)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span>Para Llevar</span>
                </div>
                <span className="font-bold">{formatCurrency(analytics.revenue.byType.TAKEAWAY)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Motorbike className="h-4 w-4 text-purple-600" />
                  <span>Delivery</span>
                </div>
                <span className="font-bold">{formatCurrency(analytics.revenue.byType.DELIVERY)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables Status */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Mesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-900">{analytics.tables.free}</p>
                <p className="text-sm text-emerald-600">Libres</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-900">{analytics.tables.occupied}</p>
                <p className="text-sm text-red-600">Ocupadas</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-900">{analytics.tables.dirty}</p>
                <p className="text-sm text-amber-600">Sucias</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{analytics.tables.total}</p>
                <p className="text-sm text-slate-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KDS Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Cocina (KDS)</span>
              {analytics.kds.overdue > 0 && (
                <Badge variant="warning" className="animate-pulse">
                  {analytics.kds.overdue} atrasadas
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-900">{analytics.kds.pending}</p>
                <p className="text-sm text-amber-600">Pendientes</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-900">{analytics.kds.preparing}</p>
                <p className="text-sm text-blue-600">Preparando</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-900">{analytics.kds.ready}</p>
                <p className="text-sm text-emerald-600">Listas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Status */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Pendientes</span>
                <Badge variant="warning">{analytics.delivery.pending}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Entregados Hoy</span>
                <Badge variant="success">{analytics.delivery.delivered}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Tiempo Promedio</span>
                <span className="font-medium">{analytics.delivery.avgTime.toFixed(0)} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span>A Tiempo</span>
                <span className={`font-medium ${analytics.delivery.onTimeRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {analytics.delivery.onTimeRate.toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
