import dayjs from 'dayjs'
import { and, eq, gte, sql, sum } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { db } from '../../db/connection'
import { orders } from '../../db/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getMonthReceipt = new Elysia()
  .use(auth)
  .get('/metrics/month-receipt', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    // const today = dayjs()
    // const startOfLastMonth = lastMonth.startOf('month')

    const currentMonth = dayjs().startOf('month')
    const lastMonth = currentMonth.subtract(1, 'month')

    const monthsReceipts = await db
      .select({
        receipt: sum(orders.totalInCents).mapWith(Number),
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, lastMonth.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)

    const lastMonthWithYear = lastMonth.format('YYYY-MM')
    const currentMonthWithYear = currentMonth.format('YYYY-MM')

    const currentMonthReceipt = monthsReceipts.find(
      (receipt) => receipt.monthWithYear === currentMonthWithYear,
    )
    const lastMonthReceipt = monthsReceipts.find(
      (receipt) => receipt.monthWithYear === lastMonthWithYear,
    )

    const diffFromLastMonth =
      currentMonthReceipt && lastMonthReceipt
        ? (currentMonthReceipt.receipt * 100) / lastMonthReceipt.receipt
        : 0

    return {
      receipt: currentMonthReceipt?.receipt || 0,
      diffFromLastMonth: lastMonthReceipt
        ? Number((diffFromLastMonth - 100).toFixed(2))
        : 0,
    }
  })
