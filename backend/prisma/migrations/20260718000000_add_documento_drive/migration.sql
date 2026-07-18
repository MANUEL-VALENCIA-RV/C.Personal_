-- AlterTable: Add missing columns to existing tables
ALTER TABLE "Usuario" ADD COLUMN "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Trabajador" ADD COLUMN "empresaId" INTEGER;
ALTER TABLE "Trabajador" ADD COLUMN "driveFolderId" TEXT;

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mimeType" TEXT,
    "carpetaId" TEXT,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoFormulario" (
    "id" SERIAL NOT NULL,
    "seccion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "opciones" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampoFormulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoRequerido" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentoRequerido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AptitudConfig" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AptitudConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeccionExpediente" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SeccionExpediente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nombre_key" ON "Empresa"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Documento_driveFileId_key" ON "Documento"("driveFileId");

-- CreateIndex
CREATE UNIQUE INDEX "CampoFormulario_seccion_nombre_key" ON "CampoFormulario"("seccion", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoRequerido_nombre_key" ON "DocumentoRequerido"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "AptitudConfig_nombre_key" ON "AptitudConfig"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SeccionExpediente_clave_key" ON "SeccionExpediente"("clave");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trabajador" ADD CONSTRAINT "Trabajador_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
