/* eslint-disable drizzle/enforce-delete-with-where */
import { faker } from '@faker-js/faker'
import { createId } from '@paralleldrive/cuid2'
import chalk from 'chalk'
import { db } from './connection'
import {
  authLinks,
  orderItems,
  orderStatusenum,
  orders,
  products,
  restaurants,
  users,
} from './schema'

/**
 * Reset database and seed with fake data
 */
await db.delete(orderItems)
await db.delete(orders)
await db.delete(products)
await db.delete(authLinks)
await db.delete(users)
await db.delete(restaurants)

console.log(chalk.yellow('✔️ Database reset!'))

/**
 * Create customers
 */
const [customer1, customer2] = await db
  .insert(users)
  .values([
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
  ])
  .returning({
    id: users.id,
  })
console.log(chalk.yellow('✔️ Customers created!'))

/**
 * Create manager
 */
const [manager] = await db
  .insert(users)
  .values([
    {
      name: faker.person.fullName(),
      email: 'admin@admin.com',
      role: 'manager',
    },
  ])
  .returning({
    id: users.id,
  })
console.log(chalk.yellow('✔️ Manager created!'))

/**
 * Create restaurants
 */
const [restaurant] = await db
  .insert(restaurants)
  .values([
    {
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      managerId: manager.id,
    },
  ])
  .returning({
    id: restaurants.id,
  })
console.log(chalk.yellow('✔️ Restaurants created!'))

function generateProduct() {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    restaurantId: restaurant.id,
    priceInCents: Number(
      faker.commerce.price({
        min: 190,
        max: 800,
        dec: 0,
      }),
    ),
  }
}

/**
 * Create products
 */
const availableProducts = await db
  .insert(products)
  .values([
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
  ])
  .returning()
console.log(chalk.yellow('✔️ Products created!'))

/**
 * Create orders
 */
type OrderItemsInsert = typeof orderItems.$inferInsert
type OrderInsert = typeof orders.$inferInsert
const orderItemsToInsert: OrderItemsInsert[] = []
const ordersToInsert: OrderInsert[] = []

for (let i = 0; i < 200; i++) {
  const orderId = createId()

  const orderProducts = faker.helpers
    .arrayElements(availableProducts, {
      min: 1,
      max: 3,
    })
    .map((orderProduct) => {
      const quantity = faker.number.int({
        min: 1,
        max: 5,
      })

      return {
        orderId,
        productId: orderProduct.id,
        quantity,
        priceInCents: orderProduct.priceInCents,
      }
    })

  const totalInCents = orderProducts.reduce(
    (acc, orderProduct) =>
      acc + orderProduct.priceInCents * orderProduct.quantity,
    0,
  )

  orderItemsToInsert.push(...orderProducts)
  ordersToInsert.push({
    id: orderId,
    restaurantId: restaurant.id,
    customerId: faker.helpers.arrayElement([customer1, customer2]).id,
    totalInCents,
    status: faker.helpers.arrayElement(orderStatusenum.enumValues),
    createdAt: faker.date.recent({
      days: 40,
    }),
  })
}
await db.insert(orders).values(ordersToInsert)
await db.insert(orderItems).values(orderItemsToInsert)
console.log(chalk.yellow('✔️ Orders created!'))

console.log(chalk.greenBright('Database seeded successfully!'))

process.exit()
