import { Elysia, t } from 'elysia'
import { db } from '../../db/connection'
import { restaurants, users } from '../../db/schema'

export const registerRestaurant = new Elysia().post(
  '/restaurants',
  async ({ body, set }) => {
    const { restaurantName, manaegrName, email, phone } = body

    const [manager] = await db
      .insert(users)
      .values({
        name: manaegrName,
        email,
        phone,
        role: 'manager',
      })
      .returning({
        id: users.id,
      })

    await db.insert(restaurants).values({
      name: restaurantName,
      managerId: manager.id,
    })

    set.status = 204
  },
  {
    body: t.Object({
      restaurantName: t.String(),
      manaegrName: t.String(),
      email: t.String({
        format: 'email',
      }),
      phone: t.String(),
    }),
  },
)
