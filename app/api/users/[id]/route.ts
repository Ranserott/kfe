import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PUT - Actualizar usuario
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
    const { name, email, password, role, phone, isActive } = body

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar que el email no esté en uso por otro usuario
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      })

      if (emailTaken) {
        return NextResponse.json({ success: false, error: 'El email ya está registrado' }, { status: 400 })
      }
    }

    // Preparar datos de actualización
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (phone !== undefined) updateData.phone = phone || null
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

// DELETE - Eliminar usuario
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

    // No permitir eliminar el propio usuario
    if (id === session.user.id) {
      return NextResponse.json({ success: false, error: 'No puedes eliminar tu propio usuario' }, { status: 400 })
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
