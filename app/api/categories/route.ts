import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { products: { where: { isActive: true } } },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener categorías' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, displayOrder } = body

    const category = await prisma.category.create({
      data: {
        name,
        displayOrder: displayOrder ?? 0,
      },
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ success: false, error: 'Error al crear categoría' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, displayOrder } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar categoría' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    // Check if category has products
    const categoryWithProducts = await prisma.category.findUnique({
      where: { id },
      include: { products: true },
    })

    if (!categoryWithProducts) {
      return NextResponse.json({ success: false, error: 'Categoría no encontrada' }, { status: 404 })
    }

    if (categoryWithProducts.products.length > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una categoría con productos. Elimina o reasigna los productos primero.' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar categoría' }, { status: 500 })
  }
}
