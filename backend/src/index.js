import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import prismaPkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

import trabajadoresRoutes from './routes/trabajadores.js'
import authRoutes from './routes/auth.js'
import empresasRoutes from './routes/empresas.js'
import camposRoutes from './routes/campos.js'
import configuracionRoutes from './routes/configuracion.js'
import observacionesRoutes from './routes/observaciones.js'
import cursosRoutes from './routes/cursos.js'
import calendarioRoutes from './routes/calendario.js'
import documentosRoutes from './routes/documentos.js'
import { verificarToken } from './middleware/auth.js'

const { PrismaClient } = prismaPkg

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const ES_PRODUCCION = process.env.NODE_ENV === 'production'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: ES_PRODUCCION ? undefined : false,
}))

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(morgan(ES_PRODUCCION ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: ES_PRODUCCION ? 200 : 1000,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
})

app.use('/api/', limiterGeneral)

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: ES_PRODUCCION ? 'Database connection failed' : error.message,
    })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/empresas', verificarToken, empresasRoutes)
app.use('/api/campos', verificarToken, camposRoutes)
app.use('/api/configuracion', verificarToken, configuracionRoutes)
app.use('/api/trabajadores', verificarToken, trabajadoresRoutes)
app.use('/api/observaciones', verificarToken, observacionesRoutes)
app.use('/api/cursos-trabajador', verificarToken, cursosRoutes)
app.use('/api/calendario', verificarToken, calendarioRoutes)
app.use('/api/documentos', verificarToken, documentosRoutes)

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'El archivo excede el límite de 10MB.',
    })
  }

  console.error('[ERROR]', err.stack || err.message)

  res.status(500).json({
    error: ES_PRODUCCION
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor',
  })
})

app.listen(PORT, async () => {
  console.log(`Backend corriendo en puerto ${PORT}`)

  try {
    await prisma.$connect()
    console.log('Conectado a PostgreSQL')
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message)
  }
})
