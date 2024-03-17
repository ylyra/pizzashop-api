import dayjs from 'dayjs'
import { and, count, eq, gte, sql } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { db } from '../../db/connection'
import { orders } from '../../db/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getMonthCanceledOrdersAmount = new Elysia()
  .use(auth)
  .get('/metrics/month-canceled-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    // const today = dayjs()
    // const startOfLastMonth = lastMonth.startOf('month')

    const currentMonth = dayjs().startOf('month')
    const lastMonth = currentMonth.subtract(1, 'month')

    const ordersPerMonth = await db
      .select({
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        amount: count(orders.id).mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          eq(orders.status, 'canceled'),
          gte(orders.createdAt, lastMonth.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)

    const lastMonthWithYear = lastMonth.format('YYYY-MM')
    const currentMonthWithYear = currentMonth.format('YYYY-MM')

    const currentMonthCanceledOrdersAmount = ordersPerMonth.find(
      (orderPerMonth) => orderPerMonth.monthWithYear === currentMonthWithYear,
    )
    const lastMonthAmount = ordersPerMonth.find(
      (orderPerMonth) => orderPerMonth.monthWithYear === lastMonthWithYear,
    )

    const diffFromLastOrdersMonth =
      currentMonthCanceledOrdersAmount && lastMonthAmount
        ? (currentMonthCanceledOrdersAmount.amount * 100) /
          lastMonthAmount.amount
        : 0

    return {
      amount: currentMonthCanceledOrdersAmount?.amount || 0,
      diffFromLastMonth: lastMonthAmount
        ? Number((diffFromLastOrdersMonth - 100).toFixed(2))
        : 0,
    }
  })
