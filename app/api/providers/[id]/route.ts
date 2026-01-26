import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Actualizar proveedor
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { name, phone, email, address, ruc, contactPerson, paymentTerms, notes, isActive } = body

    // Verificar que el proveedor existe
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    })

    if (!existingProvider) {
      return NextResponse.json({ success: false, error: 'Proveedor no encontrado' }, { status: 404 })
    }

    // Verificar que el RUC no esté en uso por otro proveedor
    if (ruc && ruc !== existingProvider.ruc) {
      const rucTaken = await prisma.provider.findUnique({
        where: { ruc },
      })

      if (rucTaken) {
        return NextResponse.json({ success: false, error: 'El RUC ya está registrado' }, { status: 400 })
      }
    }

    // Preparar datos de actualización
    const updateData: any = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (email !== undefined) updateData.email = email || null
    if (address !== undefined) updateData.address = address || null
    if (ruc !== undefined) updateData.ruc = ruc || null
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson || null
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms || null
    if (notes !== undefined) updateData.notes = notes || null
    if (isActive !== undefined) updateData.isActive = isActive

    // Actualizar proveedor
    const provider = await prisma.provider.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        ruc: true,
        contactPerson: true,
        paymentTerms: true,
        notes: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, provider })
  } catch (error) {
    console.error('Error updating provider:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar proveedor' }, { status: 500 })
  }
}

// DELETE - Eliminar proveedor
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params

    // Verificar que el proveedor existe
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventoryItems: true,
          },
        },
      },
    })

    if (!existingProvider) {
      return NextResponse.json({ success: false, error: 'Proveedor no encontrado' }, { status: 404 })
    }

    // Verificar que no tenga items de inventario asociados
    if (existingProvider._count.inventoryItems > 0) {
      return NextResponse.json({
        success: false,
        error: `No se puede eliminar el proveedor porque tiene ${existingProvider._count.inventoryItems} productos asociados`
      }, { status: 400 })
    }

    // Eliminar proveedor
    await prisma.provider.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar proveedor' }, { status: 500 })
  }
}
