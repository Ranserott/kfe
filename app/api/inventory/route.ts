import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: { recipes: { include: { product: true } } },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener inventario' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, currentStock, minStock, unit, costPerUnit } = body

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        currentStock: parseFloat(currentStock),
        minStock: parseFloat(minStock),
        unit,
        costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
      },
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json({ success: false, error: 'Error al crear item' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { id, currentStock, minStock } = body

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        currentStock: parseFloat(currentStock),
        minStock: parseFloat(minStock),
      },
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar item' }, { status: 500 })
  }
}
