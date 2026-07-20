import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

let prismaInstance = null

export function getPrisma() {
  if (!prismaInstance) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
    const adapter = new PrismaPg(pool)
    prismaInstance = new PrismaClient({ adapter })
  }
  return prismaInstance
}

export async function checkDatabase() {
  try {
    const prisma = getPrisma()
    await prisma.$queryRaw`SELECT 1`
    return { connected: true }
  } catch (error) {
    return { connected: false, error: error.message }
  }
}
