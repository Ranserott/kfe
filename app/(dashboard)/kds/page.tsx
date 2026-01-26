'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMinutesSince } from '@/lib/utils'
import { OrderStatus } from '@prisma/client'
import { Clock, User, ChefHat, CheckCircle2, Circle, AlertCircle, Motorbike, Package, Utensils, Flame, Star, TrendingUp } from 'lucide-react'

interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  modifiers: string[]
  notes: string | null
  product: {
    id: string
    name: string
    isPreparable: boolean
    category: {
      name: string
    }
  }
}

interface DeliveryInfo {
  id: string
  customerName: string
  customerAddress: string
  status: string
  estimatedTime: number | null
}

interface Order {
  id: string
  status: OrderStatus
  notes: string | null
  createdAt: string
  type: string
  table: {
    id: string
    number: number
  } | null
  delivery: DeliveryInfo | null
  items: OrderItem[]
}

interface OrderWithPriority extends Order {
  priority: number
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  estimatedPrepTime: number
}

export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Create SSE connection
    const eventSource = new EventSource('/api/kds/events')
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setConnected(true)
      console.log('KDS SSE connected')
    }

    eventSource.addEventListener('orders', (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.orders) {
          setOrders(data.orders)
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    })

    eventSource.addEventListener('error', (e) => {
      console.error('SSE error:', e)
      setConnected(false)
    })

    eventSource.onerror = () => {
      setConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch('/api/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        )
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 border-amber-300'
      case 'PREPARING':
        return 'bg-blue-100 border-blue-300'
      case 'READY':
        return 'bg-emerald-100 border-emerald-300'
      default:
        return 'bg-slate-100 border-slate-300'
    }
  }

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'PREPARING':
        return 'Preparando'
      case 'READY':
        return 'Lista'
      default:
        return status
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return Circle
      case 'PREPARING':
        return ChefHat
      case 'READY':
        return CheckCircle2
      default:
        return Circle
    }
  }

  const getOrderTypeConfig = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return { label: 'Local', icon: Utensils, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      case 'TAKEAWAY':
        return { label: 'Para Llevar', icon: Package, color: 'bg-blue-100 text-blue-800 border-blue-300' }
      case 'DELIVERY':
        return { label: 'Delivery', icon: Motorbike, color: 'bg-purple-100 text-purple-800 border-purple-300' }
      default:
        return { label: 'Local', icon: Utensils, color: 'bg-slate-100 text-slate-800' }
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800'
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800'
      case 'PICKED_UP':
        return 'bg-indigo-100 text-indigo-800'
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getDeliveryStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'ASSIGNED':
        return 'Asignado'
      case 'PICKED_UP':
        return 'Recogido'
      case 'IN_TRANSIT':
        return 'En Camino'
      case 'DELIVERED':
        return 'Entregado'
      default:
        return status
    }
  }

  // Group orders by status
  const pendingOrders = orders.filter((o) => o.status === 'PENDING')
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING')
  const readyOrders = orders.filter((o) => o.status === 'READY')

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kitchen Display System</h1>
          <p className="text-slate-500 mt-1">
            {connected ? (
              <span className="text-emerald-600">● Conectado</span>
            ) : (
              <span className="text-red-600">● Desconectado</span>
            )}
          </p>
        </div>
        <div className="flex gap-4">
          <Card>
            <CardContent className="py-3 px-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{pendingOrders.length}</div>
                <div className="text-xs text-slate-500">Pendientes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{preparingOrders.length}</div>
                <div className="text-xs text-slate-500">Preparando</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{readyOrders.length}</div>
                <div className="text-xs text-slate-500">Listas</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...pendingOrders, ...preparingOrders, ...readyOrders].map((order) => {
          const minutesSince = getMinutesSince(new Date(order.createdAt))
          const isOverdue = minutesSince > 10
          const StatusIcon = getStatusIcon(order.status)
          const typeConfig = getOrderTypeConfig(order.type)
          const TypeIcon = typeConfig.icon

          return (
            <Card
              key={order.id}
              className={`
                border-2 ${getStatusColor(order.status)}
                ${isOverdue ? 'animate-pulse ring-2 ring-red-500' : ''}
              `}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={typeConfig.color}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {typeConfig.label}
                      </Badge>
                      {order.table && (
                        <Badge variant="outline" className="text-sm">
                          Mesa {order.table.number}
                        </Badge>
                      )}
                      {order.delivery && (
                        <Badge className={getDeliveryStatusColor(order.delivery.status)}>
                          {getDeliveryStatusLabel(order.delivery.status)}
                        </Badge>
                      )}
                      <Badge
                        variant={order.status === 'READY' ? 'success' : 'secondary'}
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      #{order.id.slice(-6)}
                    </p>
                  </div>
                  <StatusIcon className="h-6 w-6" />
                </div>

                {/* Delivery Info */}
                {order.delivery && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-3">
                    <div className="flex items-center gap-2 text-purple-800">
                      <Motorbike className="h-4 w-4" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{order.delivery.customerName}</p>
                        <p className="text-xs text-purple-600">{order.delivery.customerAddress}</p>
                      </div>
                      {order.delivery.estimatedTime && (
                        <div className="text-xs bg-purple-100 px-2 py-1 rounded">
                          ETA: {order.delivery.estimatedTime} min
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timer */}
                <div className={`
                  flex items-center gap-1 mb-3 px-2 py-1 rounded
                  ${isOverdue ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-700'}
                `}>
                  <Clock className="h-3 w-3" />
                  <span className="text-sm font-medium">{minutesSince} min</span>
                  {isOverdue && <AlertCircle className="h-3 w-3 ml-1" />}
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="bg-white/50 rounded p-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-medium text-slate-900">
                            {item.quantity}x {item.product.name}
                          </span>
                          {item.modifiers.length > 0 && (
                            <div className="text-xs text-slate-500 mt-1">
                              + {item.modifiers.join(', ')}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-xs text-amber-600 mt-1 italic">
                              "{item.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="text-xs text-slate-600 bg-white/50 rounded p-2 mb-3">
                    Nota: {order.notes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'PENDING' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                    >
                      <ChefHat className="h-4 w-4 mr-1" />
                      Preparar
                    </Button>
                  )}
                  {order.status === 'PREPARING' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Lista
                    </Button>
                  )}
                  {order.status === 'READY' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                    >
                      Entregada
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20">
          <ChefHat className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No hay órdenes pendientes</p>
        </div>
      )}
    </div>
  )
}
