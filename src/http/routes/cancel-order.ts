import { eq } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { db } from '../../db/connection'
import { orders } from '../../db/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const cancelOrder = new Elysia().use(auth).patch(
  '/orders/:orderId/cancel',
  async ({ getCurrentUser, params, set }) => {
    const { orderId } = params
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const order = await db.query.orders.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.id, orderId),
          operators.eq(fields.restaurantId, restaurantId),
        )
      },
    })

    if (!order) {
      set.status = 400
      return {
        message: 'Order not found',
      }
    }

    if (!['pending', 'processing'].includes(order.status)) {
      set.status = 400
      return {
        message: 'You can only cancel after dispatch orders.',
      }
    }

    await db
      .update(orders)
      .set({
        status: 'canceled',
      })
      .where(eq(orders.id, orderId))
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
)
