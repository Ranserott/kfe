import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, startOfWeek, startOfMonth, format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const period = searchParams.get('period') || 'today' // today, week, month, custom
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let startDate: Date
    const endDate = new Date()

    switch (period) {
      case 'today':
        startDate = startOfDay(endDate)
        break
      case 'week':
        startDate = startOfWeek(endDate)
        break
      case 'month':
        startDate = startOfMonth(endDate)
        break
      case 'custom':
        if (!dateFrom || !dateTo) {
          return NextResponse.json({ success: false, error: 'Fechas requeridas' }, { status: 400 })
        }
        startDate = new Date(dateFrom)
        endDate.setTime(new Date(dateTo).getTime())
        break
      default:
        startDate = startOfDay(endDate)
    }

    // Fetch all relevant data in parallel
    const [
      orders,
      products,
      categories,
      tables,
      inventoryItems,
      customers,
      deliveryOrders,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          items: { include: { product: { include: { category: true } } } },
          table: true,
          delivery: true,
          customer: true,
        },
      }),
      prisma.product.findMany({
        include: { category: true, modifiers: true },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({ orderBy: { displayOrder: 'asc' } }),
      prisma.table.findMany(),
      prisma.inventoryItem.findMany(),
      prisma.customer.findMany({
        orderBy: [{ orderCount: 'desc' }, { lastOrderDate: 'desc' }],
        take: 100,
      }),
      prisma.deliveryOrder.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        include: { driver: true },
      }),
    ])

    // Calculate advanced metrics
    const closedOrders = orders.filter((o) => o.status === 'CLOSED')
    const pendingOrders = orders.filter((o) => o.status === 'PENDING')
    const preparingOrders = orders.filter((o) => o.status === 'PREPARING')
    const readyOrders = orders.filter((o) => o.status === 'READY')

    // Revenue metrics
    const totalRevenue = closedOrders.reduce((sum, o) => sum + o.total, 0)
    const revenueByType = {
      DINE_IN: orders.filter((o) => o.type === 'DINE_IN').reduce((sum, o) => sum + o.total, 0),
      TAKEAWAY: orders.filter((o) => o.type === 'TAKEAWAY').reduce((sum, o) => sum + o.total, 0),
      DELIVERY: orders.filter((o) => o.type === 'DELIVERY').reduce((sum, o) => sum + o.total, 0),
    }

    // Average ticket and order value
    const avgTicket = closedOrders.length > 0 ? totalRevenue / closedOrders.length : 0
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

    // Product analytics
    const productSales = new Map<string, { quantity: number; revenue: number; orders: number }>()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productSales.get(item.productId) || { quantity: 0, revenue: 0, orders: 0 }
        productSales.set(item.productId, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.unitPrice * item.quantity,
          orders: existing.orders + 1,
        })
      })
    })

    // Top products
    const topProducts = products
      .map((p) => ({
        ...p,
        salesData: productSales.get(p.id) || { quantity: 0, revenue: 0, orders: 0 },
      }))
      .sort((a, b) => b.salesData.revenue - a.salesData.revenue)
      .slice(0, 10)

    // Category performance
    const categoryRevenue = new Map<string, number>()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const catId = item.product.categoryId
        categoryRevenue.set(catId, (categoryRevenue.get(catId) || 0) + item.unitPrice * item.quantity)
      })
    })

    const categoryPerformance = categories.map((cat) => ({
      ...cat,
      revenue: categoryRevenue.get(cat.id) || 0,
      productCount: products.filter((p) => p.categoryId === cat.id).length,
    }))

    // Hourly sales distribution
    const hourlySales = new Array(24).fill(0)
    closedOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours()
      hourlySales[hour] += order.total
    })

    // Peak hours
    const peakHours = hourlySales
      .map((revenue, hour) => ({ hour, revenue }))
      .filter((h) => h.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)

    // Table turnover
    const tableTurnover = tables.map((t) => {
      const tableOrders = orders.filter((o) => o.tableId === t.id)
      return {
        ...t,
        ordersCount: tableOrders.length,
        revenue: tableOrders.reduce((sum, o) => sum + o.total, 0),
      }
    })

    // Inventory status
    const lowStockItems = inventoryItems.filter((i) => i.currentStock <= i.minStock)
    const outOfStockItems = inventoryItems.filter((i) => i.currentStock === 0)

    // Customer analytics
    const newCustomers = customers.filter((c) => {
      const firstOrderDate = orders.find((o) => o.customerId === c.id)?.createdAt
      return firstOrderDate && new Date(firstOrderDate) >= startDate
    }).length

    const returningCustomers = customers.filter((c) => c.orderCount > 1).length
    const vipCustomers = customers.filter((c) => c.orderCount >= 20).length

    // Delivery analytics
    const deliveredOrders = deliveryOrders.filter((d) => d.status === 'DELIVERED')
    const avgDeliveryTime =
      deliveredOrders.length > 0 && deliveredOrders[0]?.estimatedTime
        ? deliveredOrders.reduce((sum, d) => sum + (d.estimatedTime || 0), 0) / deliveredOrders.length
        : 0

    const onTimeDeliveries = deliveredOrders.filter((d) => {
      if (!d.estimatedTime || !d.pickupTime) return false
      const actualTime = Math.floor((new Date(d.pickupTime).getTime() - new Date(d.createdAt).getTime()) / 60000)
      return actualTime <= d.estimatedTime
    }).length

    const onTimeRate = deliveredOrders.length > 0 ? (onTimeDeliveries / deliveredOrders.length) * 100 : 0

    // Driver performance
    const driverPerformance = deliveryOrders.reduce((acc, d) => {
      if (!d.driverId) return acc
      const existing = acc.get(d.driverId) || { orders: 0, delivered: 0 }
      acc.set(d.driverId, {
        orders: existing.orders + 1,
        delivered: existing.delivered + (d.status === 'DELIVERED' ? 1 : 0),
      })
      return acc
    }, new Map<string, { orders: number; delivered: number }>())

    // Response data
    const analytics = {
      summary: {
        period,
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString(),
        totalRevenue,
        totalOrders: orders.length,
        closedOrders: closedOrders.length,
        pendingOrders: pendingOrders.length,
        avgTicket,
        avgOrderValue,
      },
      revenue: {
        byType: revenueByType,
        byCategory: categoryPerformance,
        hourlyDistribution: hourlySales,
        peakHours,
      },
      products: {
        top: topProducts,
        total: products.length,
        active: products.filter((p) => (p as any).isActive !== false).length,
      },
      tables: {
        total: tables.length,
        occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
        dirty: tables.filter((t) => t.status === 'DIRTY').length,
        free: tables.filter((t) => t.status === 'FREE').length,
        turnover: tableTurnover,
      },
      inventory: {
        total: inventoryItems.length,
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length,
        items: lowStockItems,
      },
      customers: {
        total: customers.length,
        new: newCustomers,
        returning: returningCustomers,
        vip: vipCustomers,
        top: customers.slice(0, 10),
      },
      delivery: {
        total: deliveryOrders.length,
        pending: deliveryOrders.filter((d) => d.status === 'PENDING').length,
        inProgress: deliveryOrders.filter((d) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
        delivered: deliveredOrders.length,
        avgTime: avgDeliveryTime,
        onTimeRate,
        fees: deliveryOrders.reduce((sum, d) => sum + d.deliveryFee, 0),
      },
      kds: {
        pending: pendingOrders.length,
        preparing: preparingOrders.length,
        ready: readyOrders.length,
        overdue: pendingOrders.filter((o) => {
          const minutes = (Date.now() - new Date(o.createdAt).getTime()) / 60000
          return minutes > 10
        }).length,
      },
    }

    return NextResponse.json({ success: true, analytics })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener analytics' }, { status: 500 })
  }
}
