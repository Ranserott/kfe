'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { formatCurrency, getMinutesSince } from '@/lib/utils'
import { updateDeliveryStatus, getDeliveryOrders } from '@/lib/server-actions/orders'
import { DeliveryStatus, OrderStatus } from '@prisma/client'
import { Motorbike, User, Clock, MapPin, Phone, CheckCircle2, Package, ChevronRight, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'

interface DeliveryOrder {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  deliveryFee: number
  status: DeliveryStatus
  estimatedTime: number | null
  actualTime: number | null
  driverId: string | null
  pickupTime: string | null
  deliveredAt: string | null
  createdAt: string
  order: {
    id: string
    total: number
    status: OrderStatus
    items: Array<{
      id: string
      quantity: number
      product: {
        name: string
      }
    }>
  }
  driver?: {
    id: string
    name: string
    phone: string | null
  }
}

type DeliveryResponse = { success: boolean; deliveries: DeliveryOrder[] }

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [drivers, setDrivers] = useState<any[]>([])

  const fetchDeliveries = async () => {
    try {
      const res = await fetch('/api/delivery')
      const data: DeliveryResponse = await res.json()
      if (data.success) {
        setDeliveries(data.deliveries)
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers')
      const data = await res.json()
      if (data.success) {
        setDrivers(data.drivers)
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  useEffect(() => {
    fetchDeliveries()
    fetchDrivers()
    const interval = setInterval(fetchDeliveries, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleStatusChange = async (deliveryId: string, status: DeliveryStatus) => {
    try {
      const result = await updateDeliveryStatus(deliveryId, status)
      if (result.success) {
        fetchDeliveries()
      }
    } catch (error) {
      console.error('Error updating delivery:', error)
    }
  }

  const handleAssignDriver = async (deliveryId: string, driverId: string) => {
    try {
      await updateDeliveryStatus(deliveryId, DeliveryStatus.ASSIGNED, driverId)
      fetchDeliveries()
    } catch (error) {
      console.error('Error assigning driver:', error)
    }
  }

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'PICKED_UP':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'IN_TRANSIT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusLabel = (status: DeliveryStatus) => {
    const labels = {
      PENDING: 'Pendiente',
      ASSIGNED: 'Asignado',
      PICKED_UP: 'Recogido',
      IN_TRANSIT: 'En camino',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'PENDING':
        return Clock
      case 'ASSIGNED':
        return User
      case 'PICKED_UP':
        return Package
      case 'IN_TRANSIT':
        return Motorbike
      case 'DELIVERED':
        return CheckCircle2
      default:
        return Clock
    }
  }

  const filteredDeliveries = filterStatus === 'all'
    ? deliveries
    : deliveries.filter(d => d.status === filterStatus)

  const stats = {
    pending: deliveries.filter(d => d.status === 'PENDING').length,
    assigned: deliveries.filter(d => d.status === 'ASSIGNED').length,
    inTransit: deliveries.filter(d => ['PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
    delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
    totalRevenue: deliveries.reduce((sum, d) => sum + d.order.total + d.deliveryFee, 0),
    avgDeliveryTime: deliveries.filter(d => d.actualTime).length > 0
      ? deliveries.filter(d => d.actualTime).reduce((sum, d) => sum + (d.actualTime || 0), 0) / deliveries.filter(d => d.actualTime).length
      : 0,
    lateDeliveries: deliveries.filter(d => {
      const minutes = getMinutesSince(new Date(d.createdAt))
      return d.estimatedTime && minutes > d.estimatedTime && d.status !== 'DELIVERED'
    }).length,
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Delivery</h1>
          <p className="text-slate-500 mt-1">Gestión de pedidos a domicilio</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="ASSIGNED">Asignados</option>
            <option value="PICKED_UP">Recogidos</option>
            <option value="IN_TRANSIT">En camino</option>
            <option value="DELIVERED">Entregados</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchDeliveries}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Pendientes</p>
                <p className="text-3xl font-bold text-amber-900 mt-1">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Asignados</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.assigned}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">En Ruta</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{stats.inTransit}</p>
              </div>
              <Motorbike className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Entregados Hoy</p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">{stats.delivered}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Ingresos Delivery</p>
                <p className="text-xl font-bold text-green-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className={`${stats.lateDeliveries > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${stats.lateDeliveries > 0 ? 'text-red-600' : 'text-slate-600'} font-medium`}>
                  Retrasados
                </p>
                <p className={`text-3xl font-bold mt-1 ${stats.lateDeliveries > 0 ? 'text-red-900' : 'text-slate-900'}`}>
                  {stats.lateDeliveries}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${stats.lateDeliveries > 0 ? 'text-red-500' : 'text-slate-400'}`} />
            </div>
            {stats.avgDeliveryTime > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                Promedio: {stats.avgDeliveryTime.toFixed(0)} min
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No hay pedidos de delivery</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDeliveries.map((delivery) => {
            const StatusIcon = getStatusIcon(delivery.status)
            const minutesSince = getMinutesSince(new Date(delivery.createdAt))
            const isLate = delivery.estimatedTime && minutesSince > delivery.estimatedTime

            return (
              <Card key={delivery.id} className={`border-2 ${isLate ? 'border-red-300' : 'border-slate-200'}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(delivery.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {getStatusLabel(delivery.status)}
                        </Badge>
                        {isLate && (
                          <Badge variant="danger" className="animate-pulse">
                            Retrasado
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{delivery.customerName}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(delivery.order.total + delivery.deliveryFee)}
                      </p>
                      {delivery.deliveryFee > 0 && (
                        <p className="text-xs text-slate-500">
                          +{formatCurrency(delivery.deliveryFee)} delivery
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-slate-900 font-medium">{delivery.customerAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <p className="text-slate-900">{delivery.customerPhone}</p>
                  </div>

                  {/* Order Items */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-2">Pedido:</p>
                    <div className="space-y-1">
                      {delivery.order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">
                        {minutesSince} min desde pedido
                      </span>
                    </div>
                    {delivery.estimatedTime && (
                      <span className={`font-medium ${isLate ? 'text-red-600' : 'text-slate-900'}`}>
                        ETA: {delivery.estimatedTime} min
                      </span>
                    )}
                  </div>

                  {/* Driver Assignment */}
                  {delivery.status === 'PENDING' && (
                    <div>
                      <Label>Asignar Repartidor:</Label>
                      <select
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignDriver(delivery.id, e.target.value)
                          }
                        }}
                        value=""
                      >
                        <option value="">Seleccionar...</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {delivery.driver && (
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{delivery.driver.name}</p>
                        {delivery.driver.phone && (
                          <p className="text-xs text-slate-500">{delivery.driver.phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {delivery.status === 'PENDING' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStatusChange(delivery.id, 'ASSIGNED')}
                      >
                        Asignar
                      </Button>
                    )}
                    {delivery.status === 'ASSIGNED' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStatusChange(delivery.id, 'PICKED_UP')}
                        >
                          Recogido
                        </Button>
                      </>
                    )}
                    {delivery.status === 'PICKED_UP' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStatusChange(delivery.id, 'IN_TRANSIT')}
                      >
                        En camino
                      </Button>
                    )}
                    {delivery.status === 'IN_TRANSIT' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStatusChange(delivery.id, 'DELIVERED')}
                      >
                        Entregado
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
