import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@controlpersonal.com').split(',')
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_NOMBRE = process.env.ADMIN_NOMBRE || 'Administrador'

async function main() {
  if (!ADMIN_PASSWORD) {
    console.log('ADMIN_PASSWORD no definido en .env. Usando seed de prueba.')
    console.log('Agrega ADMIN_PASSWORD a .env para personalizar la contraseña del admin.')
    console.log('Se usará la contraseña por defecto solo para desarrollo.\n')
  }

  const password = ADMIN_PASSWORD || 'AdminRH2025!Seguro'
  const hashed = await bcrypt.hash(password, 12)

  for (const rawEmail of ADMIN_EMAILS) {
    const email = rawEmail.trim().toLowerCase()
    const nombre = email === 'admin@controlpersonal.com' ? ADMIN_NOMBRE : email.split('@')[0]

    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (!existe) {
      await prisma.usuario.create({
        data: { email, password: hashed, nombre, rol: 'admin' }
      })
      console.log(`  ✓ ${email}`)
    } else {
      console.log(`  - ${email} ya existe`)
    }
  }

  const usuariosExtra = [
    { email: 'luisperedo@vdtconstrucciones.com', nombre: 'Luis Peredo', password: 'BIENVENID@2026' },
    { email: 'isaaccruz@vdtconstrucciones.com', nombre: 'Isaac Cruz', password: 'BIENVENID@S2026<>' }
  ]

  for (const u of usuariosExtra) {
    const existe = await prisma.usuario.findUnique({ where: { email: u.email } })
    if (!existe) {
      const hashedExtra = await bcrypt.hash(u.password, 12)
      await prisma.usuario.create({
        data: { email: u.email, password: hashedExtra, nombre: u.nombre, rol: 'user' }
      })
      console.log(`  ✓ ${u.email}`)
    } else {
      console.log(`  - ${u.email} ya existe`)
    }
  }

  const empresasDefault = [
    { nombre: 'VDT', color: '#8b5cf6', orden: 0 },
    { nombre: 'Alpa', color: '#22c55e', orden: 1 },
    { nombre: 'Chifu', color: '#f59e0b', orden: 2 },
  ]

  for (const emp of empresasDefault) {
    const existe = await prisma.empresa.findUnique({ where: { nombre: emp.nombre } })
    if (!existe) {
      await prisma.empresa.create({ data: emp })
      console.log(`  ✓ Empresa: ${emp.nombre}`)
    } else {
      console.log(`  - Empresa: ${emp.nombre} ya existe`)
    }
  }

  const camposDefault = [
    { seccion: 'datos_personales', nombre: 'Fecha de nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date', orden: 0 },
    { seccion: 'datos_personales', nombre: 'CURP', etiqueta: 'CURP', tipo: 'text', orden: 1 },
    { seccion: 'datos_personales', nombre: 'RFC', etiqueta: 'RFC', tipo: 'text', orden: 2 },
    { seccion: 'datos_personales', nombre: 'NSS', etiqueta: 'NSS', tipo: 'text', orden: 3 },
    { seccion: 'contacto', nombre: 'Dirección', etiqueta: 'Dirección', tipo: 'text', orden: 0 },
    { seccion: 'contacto', nombre: 'Código postal', etiqueta: 'Código postal', tipo: 'text', orden: 1 },
    { seccion: 'contacto', nombre: 'Localidad', etiqueta: 'Localidad', tipo: 'text', orden: 2 },
    { seccion: 'contacto', nombre: 'Teléfono personal', etiqueta: 'Teléfono personal', tipo: 'tel', orden: 3 },
    { seccion: 'contacto', nombre: 'Correo personal', etiqueta: 'Correo personal', tipo: 'email', orden: 4 },
    { seccion: 'laboral', nombre: 'Área', etiqueta: 'Área', tipo: 'text', orden: 0 },
    { seccion: 'laboral', nombre: 'Fecha de ingreso', etiqueta: 'Fecha de ingreso', tipo: 'date', orden: 1 },
    { seccion: 'laboral', nombre: 'Correo empresarial', etiqueta: 'Correo empresarial', tipo: 'email', orden: 2 },
    { seccion: 'emergencia', nombre: 'Nombre del contacto', etiqueta: 'Nombre del contacto', tipo: 'text', orden: 0 },
    { seccion: 'emergencia', nombre: 'Parentesco', etiqueta: 'Parentesco', tipo: 'text', orden: 1 },
    { seccion: 'emergencia', nombre: 'Teléfono de emergencia', etiqueta: 'Teléfono de emergencia', tipo: 'tel', orden: 2 },
    { seccion: 'emergencia', nombre: 'Padecimiento médico', etiqueta: 'Padecimiento médico', tipo: 'text', orden: 3 },
    { seccion: 'emergencia', nombre: 'Observaciones', etiqueta: 'Observaciones', tipo: 'text', orden: 4 },
    { seccion: 'uniformes', nombre: 'Camisa 1', etiqueta: 'Camisa 1', tipo: 'text', orden: 0 },
    { seccion: 'uniformes', nombre: 'Camisa 2', etiqueta: 'Camisa 2', tipo: 'text', orden: 1 },
    { seccion: 'uniformes', nombre: 'Camisa 3', etiqueta: 'Camisa 3', tipo: 'text', orden: 2 },
    { seccion: 'uniformes', nombre: 'Camisa 4', etiqueta: 'Camisa 4', tipo: 'text', orden: 3 },
    { seccion: 'uniformes', nombre: 'Talla', etiqueta: 'Talla', tipo: 'text', orden: 4 },
  ]

  for (const c of camposDefault) {
    const existe = await prisma.campoFormulario.findUnique({
      where: { seccion_nombre: { seccion: c.seccion, nombre: c.nombre } }
    })
    if (!existe) {
      await prisma.campoFormulario.create({ data: c })
      console.log(`  ✓ Campo: ${c.seccion}/${c.nombre}`)
    } else {
      console.log(`  - Campo: ${c.seccion}/${c.nombre} ya existe`)
    }
  }

  const documentosDefault = [
    { nombre: 'Solicitud de empleo', orden: 0 },
    { nombre: 'INE', orden: 1 },
    { nombre: 'Comprobante de domicilio', orden: 2 },
    { nombre: 'CURP', orden: 3 },
    { nombre: 'RFC', orden: 4 },
    { nombre: 'Comprobante de estudios', orden: 5 },
    { nombre: 'Curriculum', orden: 6 },
    { nombre: 'NSS', orden: 7 },
    { nombre: 'Licencia de conducir', orden: 8 },
  ]

  for (const doc of documentosDefault) {
    const existe = await prisma.documentoRequerido.findUnique({ where: { nombre: doc.nombre } })
    if (!existe) {
      await prisma.documentoRequerido.create({ data: doc })
      console.log(`  ✓ Documento: ${doc.nombre}`)
    } else {
      console.log(`  - Documento: ${doc.nombre} ya existe`)
    }
  }

  const aptitudesDefault = [
    { nombre: 'Información', orden: 0 },
    { nombre: 'Juicio', orden: 1 },
    { nombre: 'Vocabulario', orden: 2 },
    { nombre: 'Síntesis', orden: 3 },
    { nombre: 'Concentración', orden: 4 },
    { nombre: 'Análisis', orden: 5 },
    { nombre: 'Abstracción', orden: 6 },
    { nombre: 'Planeación', orden: 7 },
    { nombre: 'Organización', orden: 8 },
    { nombre: 'Atención', orden: 9 },
  ]

  for (const apt of aptitudesDefault) {
    const existe = await prisma.aptitudConfig.findUnique({ where: { nombre: apt.nombre } })
    if (!existe) {
      await prisma.aptitudConfig.create({ data: apt })
      console.log(`  ✓ Aptitud: ${apt.nombre}`)
    } else {
      console.log(`  - Aptitud: ${apt.nombre} ya existe`)
    }
  }

  const seccionesDefault = [
    { clave: 'datos_personales', titulo: 'Datos Personales', orden: 0 },
    { clave: 'contacto', titulo: 'Información de Contacto', orden: 1 },
    { clave: 'laboral', titulo: 'Información Laboral', orden: 2 },
    { clave: 'emergencia', titulo: 'Contacto de Emergencia', orden: 3 },
    { clave: 'uniformes', titulo: 'Equipo y Uniformes', orden: 4 },
  ]

  for (const sec of seccionesDefault) {
    const existe = await prisma.seccionExpediente.findUnique({ where: { clave: sec.clave } })
    if (!existe) {
      await prisma.seccionExpediente.create({ data: sec })
      console.log(`  ✓ Sección: ${sec.clave}`)
    } else {
      console.log(`  - Sección: ${sec.clave} ya existe`)
    }
  }

  const total = await prisma.usuario.count()
  console.log(`\nTotal usuarios: ${total}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })