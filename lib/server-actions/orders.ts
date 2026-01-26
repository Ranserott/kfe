'use server'

import { prisma } from '@/lib/prisma'
import { OrderStatus, OrderType, DeliveryStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export interface CreateOrderItem {
  productId: string
  quantity: number
  modifiers: string[]
  notes?: string
}

export interface DeliveryInfo {
  customerName: string
  customerPhone: string
  customerAddress: string
  deliveryFee: number
  estimatedTime?: number
}

export async function createOrder(data: {
  tableId?: string
  type?: OrderType
  items: CreateOrderItem[]
  notes?: string
  deliveryInfo?: DeliveryInfo
}) {
  try {
    // Get product prices
    const productIds = data.items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { modifiers: true },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Calculate total
    let total = 0
    const orderItems = data.items.map((item) => {
      const product = productMap.get(item.productId)!
      let itemPrice = product.price

      // Add modifier prices
      for (const modName of item.modifiers) {
        const modifier = product.modifiers.find((m) => m.name === modName)
        if (modifier) {
          itemPrice += modifier.priceAdjust
        }
      }

      total += itemPrice * item.quantity

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: itemPrice,
        modifiers: item.modifiers,
        notes: item.notes,
      }
    })

    // Add delivery fee if applicable
    if (data.deliveryInfo) {
      total += data.deliveryInfo.deliveryFee
    }

    // Determine order type
    const orderType: OrderType = data.type || (data.tableId ? 'DINE_IN' : 'TAKEAWAY')

    // Create order with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create customer for delivery
      let customerId = undefined
      if (data.deliveryInfo) {
        const customer = await tx.customer.upsert({
          where: { phone: data.deliveryInfo.customerPhone },
          update: {
            name: data.deliveryInfo.customerName,
            defaultAddress: data.deliveryInfo.customerAddress,
            addressHistory: {
              push: data.deliveryInfo.customerAddress,
            },
            lastOrderDate: new Date(),
            orderCount: { increment: 1 },
          },
          create: {
            name: data.deliveryInfo.customerName,
            phone: data.deliveryInfo.customerPhone,
            defaultAddress: data.deliveryInfo.customerAddress,
            addressHistory: [data.deliveryInfo.customerAddress],
          },
        })
        customerId = customer.id
      }

      // Create order
      const order = await tx.order.create({
        data: {
          tableId: data.tableId,
          type: orderType,
          total,
          notes: data.notes,
          status: OrderStatus.PENDING,
          customerId,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          table: true,
          customer: true,
        },
      })

      // Create delivery order if applicable
      if (data.deliveryInfo && customerId) {
        await tx.deliveryOrder.create({
          data: {
            orderId: order.id,
            customerName: data.deliveryInfo.customerName,
            customerPhone: data.deliveryInfo.customerPhone,
            customerAddress: data.deliveryInfo.customerAddress,
            deliveryFee: data.deliveryInfo.deliveryFee,
            estimatedTime: data.deliveryInfo.estimatedTime,
            status: DeliveryStatus.PENDING,
          },
        })
      }

      // Update table status if table is assigned
      if (data.tableId) {
        await tx.table.update({
          where: { id: data.tableId },
          data: { status: 'OCCUPIED' },
        })
      }

      return order
    })

    revalidatePath('/pos')
    revalidatePath('/tables')
    revalidatePath('/kds')
    revalidatePath('/delivery')

    return { success: true, order: result }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: 'Error al crear la orden' }
  }
}

export async function closeOrder(orderId: string) {
  try {
    // Get order with items and recipes
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                recipes: {
                  include: { inventoryItem: true },
                },
              },
            },
          },
        },
        delivery: true,
      },
    })

    if (!order) {
      return { success: false, error: 'Orden no encontrada' }
    }

    if (order.status === OrderStatus.CLOSED) {
      return { success: false, error: 'La orden ya está cerrada' }
    }

    // Validate and deduct stock
    for (const item of order.items) {
      if (!item.product.isPreparable) continue

      for (const recipe of item.product.recipes) {
        const requiredQty = recipe.quantity * item.quantity
        const inventoryItem = recipe.inventoryItem

        if (inventoryItem.currentStock < requiredQty) {
          return {
            success: false,
            error: `Stock insuficiente: ${inventoryItem.name} (requerido: ${requiredQty} ${inventoryItem.unit}, disponible: ${inventoryItem.currentStock})`,
          }
        }
      }
    }

    // Deduct stock (transaction)
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.product.isPreparable) continue

        for (const recipe of item.product.recipes) {
          const requiredQty = recipe.quantity * item.quantity

          await tx.inventoryItem.update({
            where: { id: recipe.inventoryItemId },
            data: {
              currentStock: {
                decrement: requiredQty,
              },
            },
          })
        }
      }

      // Close order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CLOSED,
          closedAt: new Date(),
        },
      })

      // If delivery order exists, mark as delivered
      if (order.delivery) {
        await tx.deliveryOrder.update({
          where: { orderId },
          data: {
            status: DeliveryStatus.DELIVERED,
            deliveredAt: new Date(),
          },
        })
      }
    })

    // Update table status to DIRTY if table is assigned
    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'DIRTY' },
      })
    }

    revalidatePath('/pos')
    revalidatePath('/tables')
    revalidatePath('/inventory')
    revalidatePath('/reports')
    revalidatePath('/delivery')

    return { success: true }
  } catch (error) {
    console.error('Error closing order:', error)
    return { success: false, error: 'Error al cerrar la orden' }
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { product: true } },
        table: true,
        delivery: true,
      },
    })

    revalidatePath('/kds')
    revalidatePath('/tables')
    revalidatePath('/delivery')

    return { success: true, order }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: 'Error al actualizar el estado' }
  }
}

export async function updateDeliveryStatus(deliveryId: string, status: DeliveryStatus, driverId?: string) {
  try {
    const updateData: any = { status }

    if (status === DeliveryStatus.PICKED_UP) {
      updateData.pickupTime = new Date()
    } else if (status === DeliveryStatus.DELIVERED) {
      updateData.deliveredAt = new Date()
    }

    if (driverId) {
      updateData.driverId = driverId
    }

    const delivery = await prisma.deliveryOrder.update({
      where: { id: deliveryId },
      data: updateData,
      include: {
        order: {
          include: {
            items: { include: { product: true } },
          },
        },
        driver: true,
      },
    })

    revalidatePath('/delivery')
    revalidatePath('/kds')

    return { success: true, delivery }
  } catch (error) {
    console.error('Error updating delivery status:', error)
    return { success: false, error: 'Error al actualizar el estado de delivery' }
  }
}

export async function getOrders(filters?: {
  status?: OrderStatus
  tableId?: string
  type?: OrderType
  dateFrom?: Date
  dateTo?: Date
}) {
  try {
    const orders = await prisma.order.findMany({
      where: filters,
      include: {
        items: {
          include: { product: true },
        },
        table: true,
        user: true,
        delivery: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, orders }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { success: false, error: 'Error al obtener las órdenes' }
  }
}

export async function getDeliveryOrders(filters?: {
  status?: DeliveryStatus
  driverId?: string
  dateFrom?: Date
  dateTo?: Date
}) {
  try {
    const deliveries = await prisma.deliveryOrder.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.driverId && { driverId: filters.driverId }),
        ...(filters?.dateFrom || filters?.dateTo ? {
          createdAt: {
            ...(filters?.dateFrom && { gte: filters.dateFrom }),
            ...(filters?.dateTo && { lte: filters.dateTo }),
          },
        } : {}),
      },
      include: {
        order: {
          include: {
            items: {
              include: { product: true },
            },
            table: true,
          },
        },
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, deliveries }
  } catch (error) {
    console.error('Error fetching delivery orders:', error)
    return { success: false, error: 'Error al obtener las órdenes de delivery' }
  }
}

export async function getCustomers(search?: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: [
        { orderCount: 'desc' },
        { lastOrderDate: 'desc' },
      ],
      take: 50,
    })

    return { success: true, customers }
  } catch (error) {
    console.error('Error fetching customers:', error)
    return { success: false, error: 'Error al obtener los clientes' }
  }
}
