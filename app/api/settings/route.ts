import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // In production, you would fetch from a database
    // For now, return default settings
    const settings = {
      storeName: 'kfe Café',
      storeAddress: '',
      storePhone: '',
      storeEmail: '',
      currency: 'ARS',
      taxRate: 21,
      openingTime: '08:00',
      closingTime: '22:00',
      daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      defaultDeliveryFee: 1500,
      defaultDeliveryTime: 30,
      maxDeliveryDistance: 5,
      enableDelivery: true,
      autoAcceptOrders: false,
      requireTableForDineIn: true,
      allowPartialPayments: false,
      enableLowStockAlerts: true,
      lowStockThreshold: 10,
      enableLateOrderAlerts: true,
      lateOrderMinutes: 15,
      kdsRefreshInterval: 2,
      showPrepTime: true,
      autoReadyOrders: false,
      receiptFooter: '¡Gracias por su visita!',
      printReceipts: false,
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener configuración' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const settings = await req.json()

    // In production, you would save to database
    // For now, just return success
    // You could also store in localStorage on the client for persistence

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ success: false, error: 'Error al guardar configuración' }, { status: 500 })
  }
}
