import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        modifiers: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener productos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, price, categoryId, isPreparable, barcode } = body

    // Verificar que el código de barras no exista
    if (barcode) {
      const existingProduct = await prisma.product.findUnique({
        where: { barcode },
      })

      if (existingProduct) {
        return NextResponse.json({ success: false, error: 'El código de barras ya está registrado' }, { status: 400 })
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        isPreparable: isPreparable ?? true,
        barcode: barcode || null,
      },
      include: { category: true },
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ success: false, error: 'Error al crear producto' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { id, isActive, name, description, price, categoryId, isPreparable, barcode } = body

    // Si se está actualizando el código de barras, verificar que no exista
    if (barcode) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          barcode,
          NOT: { id },
        },
      })

      if (existingProduct) {
        return NextResponse.json({ success: false, error: 'El código de barras ya está registrado' }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (isPreparable !== undefined) updateData.isPreparable = isPreparable
    if (barcode !== undefined) updateData.barcode = barcode || null

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, modifiers: true },
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar producto' }, { status: 500 })
  }
}
