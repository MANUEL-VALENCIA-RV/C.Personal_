import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { getPrisma, checkDatabase } from './db.js'
import logger from './logger.js'

import trabajadoresRoutes from './routes/trabajadores.js'
import authRoutes from './routes/auth.js'
import empresasRoutes from './routes/empresas.js'
import camposRoutes from './routes/campos.js'
import configuracionRoutes from './routes/configuracion.js'
import observacionesRoutes from './routes/observaciones.js'
import cursosRoutes from './routes/cursos.js'
import calendarioRoutes from './routes/calendario.js'
import documentosRoutes from './routes/documentos.js'
import googleAuthRoutes from './routes/google.js'
import { verificarToken } from './middleware/auth.js'

const app = express()
const PORT = parseInt(process.env.PORT) || 3001
const isProduction = process.env.NODE_ENV === 'production'

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProduction ? undefined : false,
}))

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
})

app.use('/api/', limiterGeneral)

app.get('/api/health', async (req, res) => {
  const db = await checkDatabase()
  const status = db.connected ? 'ok' : 'error'
  res.status(db.connected ? 200 : 503).json({
    status,
    database: db.connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/', googleAuthRoutes)
app.use('/api/empresas', verificarToken, empresasRoutes)
app.use('/api/campos', verificarToken, camposRoutes)
app.use('/api/configuracion', verificarToken, configuracionRoutes)
app.use('/api/trabajadores', verificarToken, trabajadoresRoutes)
app.use('/api/observaciones', verificarToken, observacionesRoutes)
app.use('/api/cursos-trabajador', verificarToken, cursosRoutes)
app.use('/api/calendario', verificarToken, calendarioRoutes)
app.use('/api/documentos', verificarToken, documentosRoutes)

app.use((err, req, res, _next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El archivo excede el límite de 10MB.' })
  }

  logger.error({ err }, 'Error no manejado')

  res.status(err.status || 500).json({
    error: isProduction ? 'Error interno del servidor' : err.message,
  })
})

app.listen(PORT, async () => {
  logger.info(`Backend iniciado en puerto ${PORT}`)
  const db = await checkDatabase()
  if (db.connected) {
    logger.info('Conectado a PostgreSQL')
  } else {
    logger.error({ error: db.error }, 'Error al conectar a PostgreSQL')
  }
})

export default app
