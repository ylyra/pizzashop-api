import cookie from '@elysiajs/cookie'
import jwt from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'
import { env } from '../env'

export const auth = new Elysia()
  .use(
    jwt({
      secret: env.JWT_SECRET_KEY,
      schema: t.Object({
        sub: t.String(),
        restaurantId: t.Optional(t.String()),
      }),
    }),
  )
  .use(cookie())
  .derive(({ cookie, jwt }) => {
    return {
      getCurrentUser: async () => {
        const authCookie = cookie.auth

        const payload = await jwt.verify(authCookie)

        if (!payload) {
          throw new Error('Unauthorized')
        }

        return {
          userId: payload.sub,
          restaurantId: payload.restaurantId,
        }
      },
    }
  })
