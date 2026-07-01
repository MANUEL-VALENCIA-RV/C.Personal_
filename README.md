# Control Personal

Sistema de gestión de recursos humanos con registro de trabajadores, expedientes, evaluaciones psicométricas y generación de PDF.

## Stack

- **Frontend:** React 19 + Vite 8 + CSS manual + Lucide React
- **Backend:** Node.js + Express + Prisma + PostgreSQL
- **Autenticación:** JWT + bcrypt
- **PDF:** html2pdf.js
- **Scripts:** Utilidades para migración de datos desde Excel

## Requisitos

- Node.js 20+
- PostgreSQL (o Supabase)

## Instalación

```bash
# Instalar dependencias
npm install
npm run backend:install
npm run frontend:install

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales

# Inicializar base de datos
npm run db:push
npm run db:seed

# Desarrollo
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia frontend + backend en desarrollo |
| `npm run dev:frontend` | Solo frontend (Vite) |
| `npm run dev:backend` | Solo backend (Express) |
| `npm run build` | Build de producción del frontend |
| `npm run db:generate` | Generar cliente Prisma |
| `npm run db:push` | Sincronizar schema con BD |
| `npm run db:migrate` | Ejecutar migraciones |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run db:seed` | Poblar base de datos inicial |

## Estructura

```
backend/
├── prisma/          # Schema + migraciones + seed
├── src/
│   ├── middleware/   # Autenticación, validación
│   ├── routes/       # API REST
│   └── index.js      # Entry point
└── .env

frontend/
├── src/
│   ├── components/   # Componentes reutilizables
│   ├── context/      # AuthContext
│   ├── data/         # Configuración de empresas
│   ├── db/           # Capa API (fetch)
│   ├── pages/        # Páginas de la aplicación
│   └── styles/       # CSS global
└── vite.config.js

scripts/              # Utilidades (importar Excel legacy)
```

## Licencia

MIT
