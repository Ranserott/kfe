import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const drivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, drivers })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener repartidores' }, { status: 500 })
  }
}
