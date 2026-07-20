import { Router } from 'express'
import { google } from 'googleapis'
import { getPrisma } from '../db.js'
import { generarToken } from '../middleware/auth.js'
import logger from '../logger.js'

const router = Router()

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL

const oauth2Client = CLIENT_ID
  ? new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
  : null

// GET /api/auth/google - Genera URL de autorización
router.get('/api/auth/google', (req, res) => {
  if (!oauth2Client) {
    return res.status(500).json({ error: 'Google OAuth no está configurado. Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en variables de entorno.' })
  }

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  })

  res.json({ url })
})

// GET /oauth2callback - Callback de Google
router.get('/oauth2callback', async (req, res, next) => {
  try {
    const { code } = req.query

    if (!code) {
      return res.redirect(`${CALLBACK_URL}?error=Código+no+recibido`)
    }

    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: googleUser } = await oauth2.userinfo.get()

    const prisma = getPrisma()
    const email = googleUser.email.toLowerCase().trim()

    let usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          email,
          nombre: googleUser.name || email.split('@')[0],
          password: null,
          debeCambiarPassword: false,
        },
      })
      logger.info({ userId: usuario.id, email }, 'Usuario creado vía Google OAuth')
    } else if (!usuario.password) {
      logger.info({ userId: usuario.id }, 'Login con Google')
    } else {
      logger.info({ userId: usuario.id }, 'Login con Google (cuenta existente)')
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date(), intentosFallidos: 0, bloqueadoHasta: null },
    })

    await prisma.loginLog.create({ data: { email, ip: req.ip || 'desconocida', exitoso: true } })

    const token = generarToken(usuario)

    const params = new URLSearchParams({
      token,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    })

    res.redirect(`${CALLBACK_URL}?${params.toString()}`)
  } catch (error) {
    logger.error({ err: error.message }, 'Error en Google OAuth callback')
    res.redirect(`${CALLBACK_URL}?error=Error+al+autenticar+con+Google`)
  }
})

export default router
