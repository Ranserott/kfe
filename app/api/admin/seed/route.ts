import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TableStatus } from '@prisma/client'

// POST - Crear datos iniciales (mesas, etc.)
export async function POST() {
  try {
    // Crear 8 mesas
    const tablesData = []
    for (let i = 1; i <= 8; i++) {
      const table = await prisma.table.upsert({
        where: { number: i },
        update: {},
        create: {
          number: i,
          capacity: i <= 4 ? 2 : 4,
          status: TableStatus.FREE,
          positionX: ((i - 1) % 4) * 150 + 50,
          positionY: Math.floor((i - 1) / 4) * 150 + 50,
        },
      })
      tablesData.push(table)
    }

    return NextResponse.json({
      success: true,
      message: 'Datos iniciales creados exitosamente',
      tablesCreated: tablesData.length,
      tables: tablesData.map(t => ({ number: t.number, capacity: t.capacity, status: t.status }))
    })
  } catch (error) {
    console.error('Error creating seed data:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al crear datos iniciales',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Verificar estado de los datos
export async function GET() {
  try {
    const tableCount = await prisma.table.count()

    if (tableCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay datos. Listo para inicializar.',
        tableCount: 0,
        needsSeed: true
      })
    }

    const tables = await prisma.table.findMany({
      select: {
        number: true,
        capacity: true,
        status: true,
        positionX: true,
        positionY: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Base de datos contiene ${tableCount} mesas`,
      tableCount,
      tables,
      needsSeed: false
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
