'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMinutesSince } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { TableStatus, OrderStatus } from '@prisma/client'
import { Utensils, Package, Motorbike, Users, Clock, Plus, AlertCircle, Check, X, MoreVertical, Home, User, ShoppingCart } from 'lucide-react'

interface Table {
  id: string
  number: number
  capacity: number
  status: TableStatus
  positionX: number | null
  positionY: number | null
  orders: Array<{
    id: string
    status: OrderStatus
    type: string
    total: number
    createdAt: string
    closedAt: string | null
    items: Array<{ product: { name: string } }>
    delivery: {
      status: string
      customerName: string
    } | null
  }>
}

type TablesResponse = { success: boolean; tables: Table[] }

export default function TablesPage() {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [actionMenuTable, setActionMenuTable] = useState<string | null>(null)

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables')
      const data: TablesResponse = await res.json()
      if (data.success) {
        setTables(data.tables)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
    const interval = setInterval(fetchTables, 5000)
    return () => clearInterval(interval)
  }, [])

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return Utensils
      case 'TAKEAWAY':
        return Package
      case 'DELIVERY':
        return Motorbike
      default:
        return Utensils
    }
  }

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return 'bg-emerald-100 text-emerald-800'
      case 'TAKEAWAY':
        return 'bg-blue-100 text-blue-800'
      case 'DELIVERY':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return 'Local'
      case 'TAKEAWAY':
        return 'Para llevar'
      case 'DELIVERY':
        return 'Delivery'
      default:
        return type
    }
  }

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800'
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800'
      case 'READY':
        return 'bg-emerald-100 text-emerald-800'
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800'
      case 'CLOSED':
        return 'bg-slate-100 text-slate-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getOrderStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'PREPARING':
        return 'Preparando'
      case 'READY':
        return 'Lista'
      case 'DELIVERED':
        return 'Entregada'
      case 'CLOSED':
        return 'Cerrada'
      case 'CANCELLED':
        return 'Cancelada'
      default:
        return status
    }
  }

  const handleTableClick = async (tableId: string, currentStatus: TableStatus) => {
    // Open action menu on click
    setActionMenuTable(tableId)
  }

  const changeTableStatus = async (tableId: string, newStatus: TableStatus) => {
    try {
      const res = await fetch('/api/tables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tableId, status: newStatus }),
      })
      if (res.ok) {
        fetchTables()
        setActionMenuTable(null)
      } else {
        alert('Error al cambiar estado de la mesa')
      }
    } catch (error) {
      console.error('Error changing table status:', error)
      alert('Error al cambiar estado de la mesa')
    }
  }

  const getStatusActions = (currentStatus: TableStatus, tableId?: string) => {
    const actions: { label: string; status?: TableStatus; icon: any; color: string; action?: () => void }[] = []

    if (currentStatus === 'FREE') {
      actions.push(
        { label: 'Tomar Mesa / Agregar Productos', status: 'OCCUPIED', icon: ShoppingCart, color: 'text-amber-600', action: () => tableId && goToPOS(tableId) },
        { label: 'Marcar Ocupada', status: 'OCCUPIED', icon: Users, color: 'text-amber-600' },
        { label: 'Marcar Sucia', status: 'DIRTY', icon: AlertCircle, color: 'text-red-600' }
      )
    } else if (currentStatus === 'OCCUPIED') {
      actions.push(
        { label: 'Agregar Productos', icon: ShoppingCart, color: 'text-blue-600', action: () => tableId && goToPOS(tableId) },
        { label: 'Marcar Libre', status: 'FREE', icon: Check, color: 'text-emerald-600' },
        { label: 'Marcar Sucia', status: 'DIRTY', icon: X, color: 'text-red-600' }
      )
    } else if (currentStatus === 'DIRTY') {
      actions.push(
        { label: 'Limpiar / Libre', status: 'FREE', icon: Check, color: 'text-emerald-600' }
      )
    }

    return actions
  }

  const goToPOS = (tableId: string) => {
    setActionMenuTable(null)
    router.push(`/pos?table=${tableId}`)
  }

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'FREE':
        return 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
      case 'OCCUPIED':
        return 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
      case 'DIRTY':
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200'
    }
  }

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case 'FREE':
        return 'Libre'
      case 'OCCUPIED':
        return 'Ocupada'
      case 'DIRTY':
        return 'Sucia'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const activeOrders = tables.flatMap((t) => t.orders.filter((o) => o.status !== 'CLOSED'))
  const totalRevenue = tables.flatMap((t) => t.orders.filter((o) => o.status === 'CLOSED')).reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mapa de Mesas</h1>
          <p className="text-slate-500 mt-1">Gestiona el estado de las mesas del local</p>
        </div>
        <Button onClick={fetchTables} variant="outline" size="sm">
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-emerald-600 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {tables.filter((t) => t.status === 'FREE').length}
                </div>
                <p className="text-sm text-slate-500">Libres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-amber-600 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {tables.filter((t) => t.status === 'OCCUPIED').length}
                </div>
                <p className="text-sm text-slate-500">Ocupadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-red-600 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {tables.filter((t) => t.status === 'DIRTY').length}
                </div>
                <p className="text-sm text-slate-500">Sucias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{activeOrders.length}</div>
                <p className="text-sm text-slate-500">Órdenes Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ${totalRevenue.toLocaleString()}
                </div>
                <p className="text-sm text-slate-500">Ventas del Día</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map((table) => {
          const activeOrder = table.orders.find(
            (o) => o.status !== 'CLOSED' && o.status !== 'CANCELLED'
          )
          const minutesSince = activeOrder
            ? getMinutesSince(new Date(activeOrder.createdAt))
            : null
          const isOverdue = minutesSince !== null && minutesSince > 10
          const showMenu = actionMenuTable === table.id

          return (
            <div key={table.id} className="relative">
              {/* Action Menu */}
              {showMenu && (
                <div className="absolute z-50 -top-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 p-2 min-w-[220px]">
                  <div className="text-xs text-slate-500 px-2 py-1 border-b mb-1">
                    Acciones Mesa {table.number}:
                  </div>
                  {getStatusActions(table.status, table.id).map((action, idx) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (action.action) {
                            action.action()
                          } else if (action.status) {
                            changeTableStatus(table.id, action.status)
                          }
                        }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-slate-100 rounded transition-colors"
                      >
                        <Icon className={`h-4 w-4 ${action.color}`} />
                        <span>{action.label}</span>
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setActionMenuTable(null)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-slate-100 rounded transition-colors text-slate-500"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              )}

              {/* Table Card */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  handleTableClick(table.id, table.status)
                }}
                className={`
                  relative w-full rounded-xl border-2 p-6 transition-all cursor-pointer
                  ${getStatusColor(table.status)}
                  ${isOverdue ? 'animate-pulse ring-2 ring-red-500' : ''}
                `}
              >
                {/* Quick Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {table.status === 'DIRTY' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        changeTableStatus(table.id, 'FREE')
                      }}
                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      title="Limpiar mesa"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {table.status === 'OCCUPIED' && !activeOrder && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        changeTableStatus(table.id, 'FREE')
                      }}
                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      title="Liberar mesa"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTable(table)
                    }}
                    className="p-1.5 bg-white/50 rounded-lg hover:bg-white/80 transition-colors"
                    title="Ver detalles"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{table.number}</div>
                  <Badge variant="outline" className="mb-2">
                    {getStatusLabel(table.status)}
                  </Badge>
                <div className="flex items-center justify-center gap-1 text-sm opacity-75">
                  <Users className="h-3 w-3" />
                  {table.capacity} {table.capacity === 1 ? 'persona' : 'personas'}
                </div>

                {activeOrder && (
                  <div className="mt-3 pt-3 border-t border-current opacity-75">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {(() => {
                        const TypeIcon = getOrderTypeIcon(activeOrder.type)
                        return <TypeIcon className="h-3 w-3" />
                      })()}
                      <span className="text-xs font-medium">
                        {getOrderTypeLabel(activeOrder.type)}
                      </span>
                    </div>
                    <Badge className={`text-xs ${getOrderTypeColor(activeOrder.type)}`}>
                      {getOrderStatusLabel(activeOrder.status)}
                    </Badge>
                    <div className="text-lg font-semibold mt-2">
                      ${activeOrder.total.toLocaleString()}
                    </div>
                    <div className="text-xs mt-1">
                      {activeOrder.items.length} {activeOrder.items.length === 1 ? 'item' : 'items'}
                    </div>
                    {minutesSince !== null && (
                      <div className={`flex items-center justify-center gap-1 mt-2 text-xs font-medium ${isOverdue ? 'text-red-700' : ''}`}>
                        <Clock className="h-3 w-3" />
                        {minutesSince} min
                        {isOverdue && <AlertCircle className="h-3 w-3" />}
                      </div>
                    )}
                  </div>
                )}

                {table.status === 'DIRTY' && (
                  <div className="mt-3 text-xs font-semibold">
                    Click para limpiar
                  </div>
                )}

                {table.status === 'FREE' && !activeOrder && (
                  <div className="mt-3 opacity-75">
                    <Plus className="h-6 w-6 mx-auto" />
                    <span className="text-xs">Click para acciones</span>
                  </div>
                )}
              </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order Details Modal */}
      {selectedTable && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedTable(null)}
        >
          <Card
            className="w-full max-w-md max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mesa {selectedTable.number}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTable(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedTable.orders.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Sin órdenes</p>
              ) : (
                <div className="space-y-4">
                  {selectedTable.orders.map((order) => {
                    const TypeIcon = getOrderTypeIcon(order.type)
                    const minutesSince = getMinutesSince(new Date(order.createdAt))
                    return (
                      <div key={order.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              #{order.id.slice(-6)}
                            </span>
                          </div>
                          <Badge className={getOrderTypeColor(order.type)}>
                            {getOrderStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          {order.items.map((item, i) => (
                            <span key={i}>
                              {i > 0 && ', '}
                              {item.product.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="h-3 w-3" />
                            {minutesSince} min
                          </span>
                          <span className="font-bold">${order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
