import { createId } from '@paralleldrive/cuid2'
import { Elysia, t } from 'elysia'
import { db } from '../../db/connection'
import { authLinks } from '../../db/schema'

export const sendAuthLink = new Elysia().post(
  '/authenticate',
  async ({ body, request }) => {
    const { email } = body

    const userFromEmail = await db.query.users.findFirst({
      where(fields, operators) {
        return operators.eq(fields.email, email)
      },
    })

    if (!userFromEmail) {
      throw new Error('User not found')
    }

    const authLinkCode = createId()

    await db.insert(authLinks).values({
      userId: userFromEmail.id,
      code: authLinkCode,
    })

    // Enviar um e-amil
    const authLink = new URL('/auth-links/authenticate', request.url)
    authLink.searchParams.set('code', authLinkCode)

    console.log(authLink.toString())
  },
  {
    body: t.Object({
      email: t.String({ format: 'email' }),
    }),
  },
)
