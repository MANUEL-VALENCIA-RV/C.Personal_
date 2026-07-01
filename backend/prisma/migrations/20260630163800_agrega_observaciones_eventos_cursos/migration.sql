-- CreateTable
CREATE TABLE "Observacion" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoCalendario" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoCalendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursosTrabajador" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "curso" TEXT NOT NULL,
    "fecha" TIMESTAMP(3),

    CONSTRAINT "CursosTrabajador_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoCalendario" ADD CONSTRAINT "EventoCalendario_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursosTrabajador" ADD CONSTRAINT "CursosTrabajador_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
