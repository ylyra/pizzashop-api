import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { db } from '../../db/connection'
import { authLinks } from '../../db/schema'
import { env } from '../../env'
import { auth } from '../auth'

export const authenticateFromLink = new Elysia().use(auth).get(
  '/auth-links/authenticate',
  async ({ query, jwt, setCookie, set }) => {
    const { code } = query

    const authLinkFromCode = await db.query.authLinks.findFirst({
      where(fields, operators) {
        return operators.eq(fields.code, code)
      },
    })

    if (!authLinkFromCode) {
      throw new Error('Auth link not found')
    }

    const minutesSinceAuthLinkWasCreated = dayjs().diff(
      authLinkFromCode.createdAt,
      'minutes',
    )

    if (minutesSinceAuthLinkWasCreated > 15) {
      throw new Error('Auth link expired, please request a new one')
    }

    const managedRestaurant = await db.query.restaurants.findFirst({
      where(fields, operators) {
        return operators.eq(fields.managerId, authLinkFromCode.userId)
      },
    })

    const token = await jwt.sign({
      sub: authLinkFromCode.userId,
      restaurantId: managedRestaurant?.id,
    })

    setCookie('auth', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    await db.delete(authLinks).where(eq(authLinks.code, code))

    set.redirect = env.AUTH_REDIRECT_URL
  },
  {
    query: t.Object({
      code: t.String(),
    }),
  },
)
