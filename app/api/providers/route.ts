import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los proveedores
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const providers = await prisma.provider.findMany({
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
        _count: {
          select: {
            inventoryItems: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const providersWithItemCount = providers.map((provider) => ({
      ...provider,
      itemCount: provider._count.inventoryItems,
    }))

    return NextResponse.json({ success: true, providers: providersWithItemCount })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener proveedores' }, { status: 500 })
  }
}

// POST - Crear nuevo proveedor
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, email, address, ruc, contactPerson, paymentTerms, notes, isActive } = body

    // Validaciones
    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Verificar que el RUC no exista
    if (ruc) {
      const existingProvider = await prisma.provider.findUnique({
        where: { ruc },
      })

      if (existingProvider) {
        return NextResponse.json({ success: false, error: 'El RUC ya está registrado' }, { status: 400 })
      }
    }

    // Crear proveedor
    const provider = await prisma.provider.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        ruc: ruc || null,
        contactPerson: contactPerson || null,
        paymentTerms: paymentTerms || null,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : true,
      },
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
    console.error('Error creating provider:', error)
    return NextResponse.json({ success: false, error: 'Error al crear proveedor' }, { status: 500 })
  }
}
