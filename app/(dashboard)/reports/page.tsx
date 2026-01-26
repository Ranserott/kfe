'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, getMinutesSince } from '@/lib/utils'
import { TrendingUp, ShoppingCart, DollarSign, Package, Motorbike, Clock, Users, Utensils, Download, FileText, FileSpreadsheet } from 'lucide-react'
import { startOfDay, subDays, format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Papa from 'papaparse'

interface Order {
  id: string
  status: string
  type: string
  total: number
  createdAt: string
  closedAt: string | null
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    product: {
      name: string
    }
  }>
  delivery: {
    status: string
    deliveryFee: number
    deliveredAt: string | null
    estimatedTime: number | null
    actualTime: number | null
  } | null
  table: {
    number: number
  } | null
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    fetchOrders()
  }, [dateRange])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case 'today':
          startDate = startOfDay(now)
          break
        case 'week':
          startDate = subDays(now, 7)
          break
        case 'month':
          startDate = subDays(now, 30)
          break
      }

      const res = await fetch(
        `/api/orders?dateFrom=${startDate.toISOString()}&dateTo=${now.toISOString()}`
      )
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate report data
  const closedOrders = orders.filter((o) => o.status === 'CLOSED')
  const deliveryOrders = orders.filter((o) => o.type === 'DELIVERY')

  // Revenue by type
  const revenueByType = {
    DINE_IN: closedOrders.filter((o) => o.type === 'DINE_IN').reduce((sum, o) => sum + o.total, 0),
    TAKEAWAY: closedOrders.filter((o) => o.type === 'TAKEAWAY').reduce((sum, o) => sum + o.total, 0),
    DELIVERY: closedOrders.filter((o) => o.type === 'DELIVERY').reduce((sum, o) => sum + o.total, 0),
  }

  const totalRevenue = closedOrders.reduce((sum, o) => sum + o.total, 0)
  const totalOrdersCount = closedOrders.length
  const avgTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0

  // Calculate top products
  const productSales = new Map<
    string,
    { productName: string; totalQuantity: number; totalRevenue: number }
  >()

  closedOrders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = productSales.get(item.productId)
      if (existing) {
        existing.totalQuantity += item.quantity
        existing.totalRevenue += item.unitPrice * item.quantity
      } else {
        productSales.set(item.productId, {
          productName: item.product.name,
          totalQuantity: item.quantity,
          totalRevenue: item.unitPrice * item.quantity,
        })
      }
    })
  })

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5)

  // Delivery metrics
  const deliveredOrders = deliveryOrders.filter((o) => o.delivery?.status === 'DELIVERED')
  const avgDeliveryTime = deliveredOrders.length > 0 && deliveredOrders[0]?.delivery?.estimatedTime
    ? deliveredOrders.reduce((sum, o) => sum + (o.delivery?.estimatedTime || 0), 0) / deliveredOrders.length
    : 0

  const totalDeliveryFees = deliveryOrders.reduce((sum, o) => sum + (o.delivery?.deliveryFee || 0), 0)

  // Orders by type
  const ordersByType = {
    DINE_IN: orders.filter((o) => o.type === 'DINE_IN').length,
    TAKEAWAY: orders.filter((o) => o.type === 'TAKEAWAY').length,
    DELIVERY: orders.filter((o) => o.type === 'DELIVERY').length,
  }

  // Export functions
  const exportToCSV = () => {
    const csvData = orders.map((order) => ({
      ID: order.id.slice(-6),
      Fecha: format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm'),
      Tipo: order.type === 'DINE_IN' ? 'Local' : order.type === 'TAKEAWAY' ? 'Para Llevar' : 'Delivery',
      Mesa: order.table?.number || '-',
      Estado: order.status,
      Items: order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', '),
      Total: order.total,
      DeliveryFee: order.delivery?.deliveryFee || 0,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_ventas_${dateRange}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportTopProductsCSV = () => {
    const csvData = topProducts.map((product, index) => ({
      Ranking: index + 1,
      Producto: product.productName,
      Cantidad: product.totalQuantity,
      Ingresos: product.totalRevenue,
      PrecioPromedio: product.totalRevenue / product.totalQuantity,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `top_productos_${dateRange}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text('Reporte de Ventas - kfe', 14, 22)

    // Date range
    doc.setFontSize(11)
    const dateRangeText = {
      today: 'Hoy',
      week: 'Últimos 7 días',
      month: 'Últimos 30 días',
    }[dateRange]
    doc.text(`Período: ${dateRangeText}`, 14, 32)
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 40)

    // Summary stats
    doc.setFontSize(14)
    doc.text('Resumen', 14, 55)

    const summaryData = [
      ['Ingresos Totales', formatCurrency(totalRevenue)],
      ['Órdenes Cerradas', totalOrdersCount.toString()],
      ['Ticket Promedio', formatCurrency(avgTicket)],
      ['Pedidos Delivery', ordersByType.DELIVERY.toString()],
    ]

    ;(doc as any).autoTable({
      startY: 60,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
    })

    // Top products
    doc.setFontSize(14)
    doc.text('Top Productos', 14, (doc as any).lastAutoTable.finalY + 15)

    const productsData = topProducts.map((p, i) => [
      (i + 1).toString(),
      p.productName,
      p.totalQuantity.toString(),
      formatCurrency(p.totalRevenue),
    ])

    ;(doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['#', 'Producto', 'Cantidad', 'Ingresos']],
      body: productsData,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
    })

    // Revenue by type
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Ingresos por Tipo', 14, 22)

    const typeData = [
      ['En Local', formatCurrency(revenueByType.DINE_IN), ordersByType.DINE_IN.toString()],
      ['Para Llevar', formatCurrency(revenueByType.TAKEAWAY), ordersByType.TAKEAWAY.toString()],
      ['Delivery', formatCurrency(revenueByType.DELIVERY), ordersByType.DELIVERY.toString()],
    ]

    ;(doc as any).autoTable({
      startY: 30,
      head: [['Tipo', 'Ingresos', 'Pedidos']],
      body: typeData,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
    })

    doc.save(`reporte_ventas_${dateRange}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`)
  }

  if (loading) {
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
          <p className="text-slate-500 mt-1">Análisis de ventas y métricas</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export buttons */}
          <div className="flex gap-2 mr-4">
            <Button variant="outline" size="sm" onClick={exportTopProductsCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV Top
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  dateRange === range
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }
              `}
            >
              {range === 'today' ? 'Hoy' : range === 'week' ? '7 días' : '30 días'}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Ingresos Totales</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              {totalOrdersCount} órdenes cerradas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Ticket Promedio</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(avgTicket)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">Por orden cerrada</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pedidos Delivery</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {ordersByType.DELIVERY}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Motorbike className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              {formatCurrency(revenueByType.DELIVERY)} en ventas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Tiempo Promedio Delivery</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {avgDeliveryTime ? `${avgDeliveryTime.toFixed(0)} min` : '-'}
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              {deliveredOrders.length} entregados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Type */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ingresos por Tipo de Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Utensils className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">En Local</p>
              <p className="text-2xl font-bold text-emerald-900">{formatCurrency(revenueByType.DINE_IN)}</p>
              <p className="text-xs text-slate-500 mt-1">{ordersByType.DINE_IN} pedidos</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">Para Llevar</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(revenueByType.TAKEAWAY)}</p>
              <p className="text-xs text-slate-500 mt-1">{ordersByType.TAKEAWAY} pedidos</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Motorbike className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">Delivery</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(revenueByType.DELIVERY)}</p>
              <p className="text-xs text-slate-500 mt-1">{ordersByType.DELIVERY} pedidos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top 5 Productos Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No hay datos disponibles para este período</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.productName}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{product.productName}</p>
                      <p className="text-sm text-slate-500">
                        {product.totalQuantity} vendidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {formatCurrency(product.totalRevenue)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(product.totalRevenue / product.totalQuantity)} c/u
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Rendimiento Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Pedidos Delivery</p>
              <p className="text-2xl font-bold text-blue-900">{deliveryOrders.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total del período</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Entregados a Tiempo</p>
              <p className="text-2xl font-bold text-emerald-900">
                {deliveryOrders.filter(d => d.delivery?.deliveredAt).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {deliveryOrders.filter(d => d.delivery?.deliveredAt).length > 0
                  ? `${((deliveryOrders.filter(d => d.delivery?.deliveredAt).length / Math.max(deliveryOrders.length, 1)) * 100).toFixed(0)}%`
                  : '0%'} del total
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Ingresos por Delivery</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(deliveryOrders.reduce((sum, o) => sum + o.total + (o.delivery?.deliveryFee || 0), 0))}
              </p>
              <p className="text-xs text-slate-500 mt-1">Incluyendo fees</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Ticket Promedio Delivery</p>
              <p className="text-2xl font-bold text-amber-900">
                {deliveryOrders.length > 0
                  ? formatCurrency(deliveryOrders.reduce((sum, o) => sum + o.total + (o.delivery?.deliveryFee || 0), 0) / deliveryOrders.length)
                  : '$0'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Por pedido</p>
            </div>
          </div>

          {deliveryOrders.filter(d => d.delivery?.status === 'DELIVERED').length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Tiempos de Entrega</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Tiempo Promedio Real</p>
                  <p className="text-lg font-bold text-slate-900">
                    {deliveryOrders.filter(d => d.delivery?.actualTime).length > 0
                      ? `${(deliveryOrders.filter(d => d.delivery?.actualTime).reduce((sum, d) => sum + (d.delivery?.actualTime || 0), 0) / deliveryOrders.filter(d => d.delivery?.actualTime).length).toFixed(0)} min`
                      : '-'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Tiempo Promedio Estimado</p>
                  <p className="text-lg font-bold text-slate-900">
                    {deliveryOrders.filter(d => d.delivery?.estimatedTime).length > 0
                      ? `${(deliveryOrders.filter(d => d.delivery?.estimatedTime).reduce((sum, d) => sum + (d.delivery?.estimatedTime || 0), 0) / deliveryOrders.filter(d => d.delivery?.estimatedTime).length).toFixed(0)} min`
                      : '-'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Cumplimiento de ETA</p>
                  <p className="text-lg font-bold text-slate-900">
                    {(() => {
                      const withBoth = deliveryOrders.filter(d => d.delivery?.actualTime && d.delivery?.estimatedTime)
                      if (withBoth.length === 0) return '-'
                      const onTime = withBoth.filter(d => (d.delivery?.actualTime || 0) <= (d.delivery?.estimatedTime || 0)).length
                      return `${((onTime / withBoth.length) * 100).toFixed(0)}%`
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No hay órdenes para este período</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">ID/Mesa</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Hora</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Items</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 15).map((order) => {
                  const typeConfig = {
                    DINE_IN: { label: 'Local', icon: Utensils, color: 'bg-emerald-100 text-emerald-800' },
                    TAKEAWAY: { label: 'Para llevar', icon: Package, color: 'bg-blue-100 text-blue-800' },
                    DELIVERY: { label: 'Delivery', icon: Motorbike, color: 'bg-purple-100 text-purple-800' },
                  }
                  const config = typeConfig[order.type as keyof typeof typeConfig] || typeConfig.DINE_IN
                  const Icon = config.icon

                  return (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <Badge className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">
                        #{order.id.slice(-6)}
                        {order.table && ` • M${order.table.number}`}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {format(new Date(order.createdAt), 'HH:mm')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            order.status === 'CLOSED'
                              ? 'success'
                              : order.status === 'PENDING'
                              ? 'warning'
                              : order.status === 'READY'
                              ? 'secondary'
                              : 'secondary'
                          }
                        >
                          {order.status === 'CLOSED'
                            ? 'Cerrada'
                            : order.status === 'PENDING'
                            ? 'Pendiente'
                            : order.status === 'PREPARING'
                            ? 'Preparando'
                            : order.status === 'READY'
                            ? 'Lista'
                            : order.status === 'DELIVERED'
                            ? 'Entregada'
                            : order.status === 'CANCELLED'
                            ? 'Cancelada'
                            : order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-semibold">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  )
                })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
