import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Get all customers with order stats
    const customers = await prisma.customer.findMany({
      orderBy: { lastOrderDate: 'desc' },
    })

    // Calculate stats for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await prisma.order.findMany({
          where: { customerId: customer.id },
          select: { total: true },
        })

        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
        const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0

        return {
          ...customer,
          totalSpent,
          avgOrderValue,
        }
      })
    )

    return NextResponse.json({ success: true, customers: customersWithStats })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener clientes' }, { status: 500 })
  }
}
