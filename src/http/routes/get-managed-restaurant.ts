import { Elysia } from 'elysia'
import { db } from '../../db/connection'
import { auth } from '../auth'

export const getManagedRestaurant = new Elysia()
  .use(auth)
  .get('/managed-restaurant', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new Error('User does not manage a restaurant')
    }

    const managedRestaurant = await db.query.restaurants.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, restaurantId)
      },
    })

    if (!managedRestaurant) {
      throw new Error('Restaurant not found')
    }

    return managedRestaurant
  })
