import bcrypt from 'bcrypt'
import { prisma } from '../src/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SALT_ROUNDS = 12
const __filename = fileURLToPath(import.meta.url)

async function crearUsuario() {
  const email = 'isaaccruz@vdtconstrucciones.com'
  const password = 'ISAC2026nueva$'
  const nombre = 'Administrador'
  const rol = 'admin'

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  
  try {
    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashed,
        nombre,
        rol,
        debeCambiarPassword: false
      }
    })
    console.log('✅ Usuario creado:', usuario.email)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    // Borrarse a sí mismo
    setTimeout(() => {
      try {
        fs.unlinkSync(__filename)
        console.log('🗑️ Script eliminado')
      } catch (err) {
        console.error('⚠️ No se pudo eliminar el archivo:', err.message)
      }
      process.exit(0)
    }, 1000)
  }
}

crearUsuario()