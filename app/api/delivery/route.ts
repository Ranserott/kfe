import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const deliveries = await prisma.deliveryOrder.findMany({
      where,
      include: {
        order: {
          include: {
            items: {
              include: { product: true },
            },
            table: true,
          },
        },
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, deliveries })
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener deliveries' }, { status: 500 })
  }
}
