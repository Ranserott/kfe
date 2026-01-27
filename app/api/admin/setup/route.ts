import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST - Crear usuario admin (solo si no existen usuarios)
export async function POST() {
  try {
    // Verificar si ya existe algún usuario
    const userCount = await prisma.user.count()

    if (userCount > 0) {
      // Si ya hay usuarios, devolver información sobre ellos
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Ya existen usuarios en el sistema. No se puede crear admin.',
        userCount,
        users
      }, { status: 400 })
    }

    // Crear usuario admin
    const email = 'admin@kfe.cl'
    const password = 'Admin123!'
    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        phone: '+56 9 1234 5678',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario admin creado exitosamente',
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      credentials: {
        email,
        password
      }
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al crear usuario admin',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Verificar estado de la base de datos
export async function GET() {
  try {
    const userCount = await prisma.user.count()

    if (userCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Base de datos vacía. Listo para crear admin.',
        userCount: 0,
        canCreateAdmin: true
      })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Base de datos contiene usuarios',
      userCount,
      users,
      canCreateAdmin: false
    })
  } catch (error) {
    console.error('Error checking database:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al verificar base de datos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
