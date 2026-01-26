import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DeliveryStatus } from '@prisma/client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, driverId } = body

    const updateData: any = { status }

    if (status === DeliveryStatus.PICKED_UP) {
      updateData.pickupTime = new Date()
    } else if (status === DeliveryStatus.DELIVERED) {
      updateData.deliveredAt = new Date()
    }

    if (driverId) {
      updateData.driverId = driverId
    }

    const delivery = await prisma.deliveryOrder.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            items: { include: { product: true } },
          },
        },
        driver: true,
      },
    })

    return NextResponse.json({ success: true, delivery })
  } catch (error) {
    console.error('Error updating delivery:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar delivery' }, { status: 500 })
  }
}
