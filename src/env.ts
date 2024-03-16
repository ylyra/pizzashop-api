import { minLength, object, parse, string, url } from 'valibot'

const envSchema = object({
  DATABASE_URL: string([url(), minLength(1)]),
  AUTH_REDIRECT_URL: string([url(), minLength(1)]),
  JWT_SECRET_KEY: string([minLength(1)]),
})

export const env = parse(envSchema, process.env)
