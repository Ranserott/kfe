import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TableStatus } from '@prisma/client'

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        orders: {
          where: { status: { in: ['PENDING', 'PREPARING', 'READY', 'DELIVERED'] } },
          include: { items: { include: { product: true } } },
        },
      },
      orderBy: { number: 'asc' },
    })

    return NextResponse.json({ success: true, tables })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener mesas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { number, capacity, positionX, positionY } = body

    // Verificar si ya existe una mesa con ese número
    const existingTable = await prisma.table.findUnique({
      where: { number }
    })

    if (existingTable) {
      return NextResponse.json({ success: false, error: `Ya existe una mesa con el número ${number}` }, { status: 400 })
    }

    const table = await prisma.table.create({
      data: {
        number,
        capacity: capacity || 2,
        status: TableStatus.FREE,
        positionX: positionX || null,
        positionY: positionY || null,
      },
    })

    return NextResponse.json({ success: true, table })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json({ success: false, error: 'Error al crear mesa' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { id, status } = body

    const table = await prisma.table.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, table })
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar mesa' }, { status: 500 })
  }
}
