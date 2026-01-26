import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      let lastOrders: any[] = []
      let retryCount = 0
      const maxRetries = 5

      const sendEvent = (data: any, event = 'message') => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      const sendKeepAlive = () => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'))
      }

      const fetchOrders = async () => {
        try {
          const orders = await prisma.order.findMany({
            where: {
              status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY] },
            },
            include: {
              items: {
                include: { product: true },
              },
              table: true,
              delivery: {
                select: {
                  id: true,
                  customerName: true,
                  customerAddress: true,
                  status: true,
                  estimatedTime: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          })

          // Check if orders changed
          const ordersChanged =
            orders.length !== lastOrders.length ||
            orders.some((o, i) => {
              const lastOrder = lastOrders[i]
              return !lastOrder || o.status !== lastOrder.status || o.id !== lastOrder.id
            })

          if (ordersChanged) {
            lastOrders = orders
            sendEvent({ orders }, 'orders')
          }

          retryCount = 0 // Reset retry count on success
        } catch (error) {
          console.error('Error fetching KDS orders:', error)
          retryCount++

          if (retryCount >= maxRetries) {
            sendEvent({ error: 'Connection error' }, 'error')
            controller.close()
            return
          }
        }
      }

      // Initial fetch
      await fetchOrders()

      // Poll every 2 seconds
      const intervalId = setInterval(async () => {
        await fetchOrders()
        sendKeepAlive()
      }, 2000)

      // Keep-alive every 30 seconds
      const keepAliveId = setInterval(() => {
        sendKeepAlive()
      }, 30000)

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        clearInterval(keepAliveId)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
