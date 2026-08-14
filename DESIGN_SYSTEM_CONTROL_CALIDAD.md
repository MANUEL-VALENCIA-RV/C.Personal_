# 🏗️ SISTEMA DE DISEÑO - Control de Calidad de Viviendas

## 🎯 OBJETIVO
Crear un módulo de **Control de Calidad de Viviendas** que:
- Usa los MISMOS colores, tipografía y componentes que RH
- Pero con contenido diferente (viviendas, proyectos, inspecciones)
- Trabajadores RH ≠ Trabajadores Control de Calidad
- Admin ve ambos módulos en el dashboard

---

## 🎨 PALETA COMPARTIDA (Igual a RH)

| Color | Código | Uso |
|-------|--------|-----|
| **Azul** | `#3b82f6` | Primario, botones principales |
| **Púrpura** | `#8b5cf6` | Alertas, estados especiales |
| **Naranja** | `#f59e0b` | Warnings, inspecciones pendientes |
| **Rojo** | `#ef4444` | Crítico, no conformidades |
| **Verde** | `#22c55e` | Confirmado, aprobado |
| **Cian** | `#06b6d4` | Info secundaria, proyectos |
| **BG Oscuro** | `#0f172a` | Fondo (igual que RH) |

---

## 📐 ESTRUCTURA DEL MÓDULO CONTROL DE CALIDAD

### PÁGINA INICIO (Dashboard)

```
┌─────────────────────────────────────────────┐
│ Buenos días, Inspector                       │
│ Centro de Control de Calidad - Viviendas    │
│ Resumen de proyectos y conformidades        │
├─────────────────────────────────────────────┤
│ [KPI: Total Viviendas] [KPI: En Inspección] │
│ [KPI: Aprobadas]      [KPI: No Conformes]   │
├─────────────────────────────────────────────┤
│ ⚠️ PENDIENTES                                │
│ [Alert: Inspecciones Pendientes]            │
│ [Alert: No Conformidades por Corregir]      │
├─────────────────────────────────────────────┤
│ 🏗️ PROYECTOS RECIENTES                      │
│ [Lista de proyectos]                        │
├─────────────────────────────────────────────┤
│ 🔍 ACCESOS RÁPIDOS                          │
│ [Nueva Inspección] [Ver Proyectos] [Reportes]
└─────────────────────────────────────────────┘
```

---

## 🎯 MENÚ LATERAL (SIDEBAR)

Agregar opción nueva:
```
📊 CONTROL RH (actual)
  └─ Inicio
  └─ Trabajadores
  └─ Registro
  └─ Expediente
  └─ Calendario

🏗️ CONTROL DE CALIDAD (nuevo)
  └─ Inicio CC
  └─ Proyectos
  └─ Inspecciones
  └─ Reportes
  └─ No Conformidades
```

---

## 📊 COMPONENTES (REUTILIZAR)

### KPI Card - Control de Calidad
```jsx
<KPICard
  icon={<Building2 size={22} />}
  count={145}
  label="Total de Viviendas"
  trend={[10, 15, 12, 18, 16, 22]}
  color="#3b82f6"  // Azul (igual que RH)
  bgColor="rgba(59,130,246,0.12)"
/>
```

### Alert Card - No Conformidades
```jsx
<AlertCard
  icon={<AlertTriangle size={20} />}
  count={8}
  label="No Conformidades"
  desc="Defectos pendientes de corrección"
  color="#ef4444"  // Rojo (crítico)
  onClick={() => navigate('/control-calidad/no-conformidades')}
/>
```

### Quick Card - Accesos
```jsx
<QuickCard
  icon={<CheckCircle size={22} />}
  title="Nueva Inspección"
  desc="Registrar inspección de vivienda"
  onClick={() => navigate('/control-calidad/nueva-inspeccion')}
  accent="#3b82f6"  // Azul
/>
```

---

## 🔐 CONTROL DE ACCESO (Por Rol)

### Usuario ADMIN
- Ve dashboard principal
- Acceso a "Centro de Control de Personal" (RH)
- Acceso a "Control de Calidad" (Viviendas)
- Puede cambiar entre módulos

### Usuario RH
- Solo ve módulo "Centro de Control de Personal"
- No ve nada de Viviendas/Control de Calidad

### Usuario Control de Calidad
- Solo ve módulo "Control de Calidad"
- No ve nada de RH/Trabajadores

---

## 📁 ESTRUCTURA DE CARPETAS

```
frontend/src/
├── pages/
│   ├── Inicio.jsx                    (RH actual)
│   ├── ControlCalidad/
│   │   ├── InicioCC.jsx              ✨ NEW
│   │   ├── InicioCC.css              ✨ NEW
│   │   ├── Proyectos.jsx             ✨ NEW
│   │   ├── Inspecciones.jsx          ✨ NEW
│   │   ├── NoConformidades.jsx       ✨ NEW
│   │   └── Reportes.jsx              ✨ NEW
│   └── ...
├── components/
│   ├── PageEditor.jsx                (existente)
│   ├── Sidebar.jsx                   (modificar para nuevas rutas)
│   └── ...
```

---

## 🎨 PALETA DE COLORES POR ESTATUS (Control de Calidad)

| Estatus | Color | Significado |
|---------|-------|-------------|
| Aprobado | `#22c55e` | Vivienda cumple |
| En Inspección | `#3b82f6` | Actualmente revisando |
| No Conforme | `#ef4444` | Defectos encontrados |
| Por Revisar | `#f59e0b` | Pendiente inspección |
| Corregido | `#8b5cf6` | Defectos subsanados |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear archivo `InicioCC.jsx` (como Inicio.jsx pero con datos de viviendas)
- [ ] Crear archivo `InicioCC.css` (mismo estilo que Inicio.css)
- [ ] Agregar rutas en `App.jsx` para Control de Calidad
- [ ] Modificar `Sidebar.jsx` para mostrar opciones según rol
- [ ] Crear backend endpoints para viviendas/inspecciones
- [ ] Agregar roles "control_calidad" en la BD
- [ ] Middleware de permisos por módulo
- [ ] Tests de acceso por rol

---

## 🚀 PUNTO DE ENTRADA

### URL de RH (actual)
```
/
/trabajadores
/registro
/expediente/:id
/calendario
```

### URL de Control de Calidad (nuevo)
```
/control-calidad
/control-calidad/proyectos
/control-calidad/inspecciones
/control-calidad/no-conformidades
/control-calidad/reportes
```

---

## 📌 RESUMEN VISUAL

```
MISMO DISEÑO = MISMOS COLORES + COMPONENTES
         ↓
DIFERENTE CONTENIDO = DIFERENTES DATOS

Admin Dashboard
├─ Módulo RH
│  ├─ Trabajadores
│  ├─ Calendario
│  └─ Expedientes
│
└─ Módulo Control de Calidad
   ├─ Viviendas
   ├─ Inspecciones
   └─ Reportes
```

**Los usuarios normales SOLO ven SU módulo asignado** 🔒
