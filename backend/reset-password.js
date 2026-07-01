import bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("NuevaContraseña123!", 10)

  await prisma.usuario.update({
    where: { id: 1 },
    data: { password: passwordHash },
  })

  console.log("Contraseña actualizada")
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect()
})
