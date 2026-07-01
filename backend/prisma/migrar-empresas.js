import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const empresas = await prisma.empresa.findMany()
  const map = Object.fromEntries(empresas.map(e => [e.nombre, e.id]))
  const trabajadores = await prisma.trabajador.findMany({ where: { empresaId: null } })

  let actualizados = 0
  for (const t of trabajadores) {
    const id = map[t.empresa]
    if (id) {
      await prisma.trabajador.update({
        where: { id: t.id },
        data: { empresaId: id }
      })
      actualizados++
    }
  }

  console.log(`Empresas en BD: ${empresas.length}`)
  console.log(`Trabajadores actualizados con empresaId: ${actualizados}`)
  console.log(`Trabajadores sin empresa coincidente: ${trabajadores.length - actualizados}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
