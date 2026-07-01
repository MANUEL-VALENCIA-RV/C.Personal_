export const pageConfigs = {
  '/': {
    pageKey: 'inicio',
    fields: [
      { id: 'titulo', label: 'Título de la página', default: 'Centro de Control de Personal' },
      { id: 'subtitulo', label: 'Subtítulo', default: 'Resumen general del sistema de Recursos Humanos' },
      { id: 'footer', label: 'Texto del pie', default: 'Sistema de Gestión de Recursos Humanos' },
      { id: 'titulo_pendientes', label: 'Título sección pendientes', default: 'Pendientes por atender' },
      { id: 'titulo_recientes', label: 'Título sección recientes', default: 'Trabajadores recientes' },
      { id: 'titulo_accesos', label: 'Título accesos rápidos', default: 'Accesos rápidos' },
    ],
    lists: [
      {
        id: 'empresas',
        titulo: 'Empresas',
        desc: 'Agrega empresas. El nombre que pongas se usará tanto en pantalla como para filtrar en la base de datos.',
        template: { label: '', color: '#3b82f6' },
        campos: [
          { id: 'label', label: 'Nombre de la empresa', placeholder: 'Ej: Mi Empresa' },
          { id: 'color', label: 'Color', tipo: 'color' },
        ],
        defaults: [
          { label: 'VDT', color: '#8b5cf6' },
          { label: 'Alpa', color: '#22c55e' },
          { label: 'Chifu', color: '#f59e0b' },
        ]
      }
    ]
  },
  '/trabajadores': {
    pageKey: 'trabajadores',
    fields: [
      { id: 'titulo', label: 'Título de la página', default: 'Trabajadores' },
      { id: 'subtitulo', label: 'Subtítulo', default: 'Consulta y filtra el personal registrado' },
      { id: 'buscar_placeholder', label: 'Placeholder del buscador', default: 'Buscar por nombre, CURP o RFC' },
    ]
  },
  '/registro': {
    pageKey: 'registro',
    fields: [
      { id: 'titulo', label: 'Título de la página', default: 'Registro' },
    ]
  },
  '/editar': {
    pageKey: 'editar',
    lists: [
      {
        id: 'documentos',
        titulo: 'Campos de documentación',
        desc: 'Agrega o quita los tipos de documento que se solicitan al trabajador.',
        template: { label: '' },
        campos: [
          { id: 'label', label: 'Nombre del documento', placeholder: 'Ej: INE' },
        ],
        defaults: [
          { label: 'Solicitud de empleo' },
          { label: 'INE' },
          { label: 'Comprobante de domicilio' },
          { label: 'CURP' },
          { label: 'RFC' },
          { label: 'Comprobante de estudios' },
          { label: 'Curriculum' },
          { label: 'NSS' },
          { label: 'Licencia de conducir' },
        ]
      }
    ]
  },
  '/expediente': {
    pageKey: 'expediente',
    fields: [
      { id: 'titulo', label: 'Título de la página', default: 'Expediente' },
    ],
    lists: [
      {
        id: 'documentos',
        titulo: 'Campos de documentación',
        desc: 'Agrega, edita, reordena o elimina los tipos de documento.',
        template: { label: '' },
        campos: [
          { id: 'label', label: 'Nombre del documento', placeholder: 'Ej: INE' },
        ],
        defaults: [
          { label: 'Solicitud de empleo' },
          { label: 'INE' },
          { label: 'Comprobante de domicilio' },
          { label: 'CURP' },
          { label: 'RFC' },
          { label: 'Comprobante de estudios' },
          { label: 'Curriculum' },
          { label: 'NSS' },
          { label: 'Licencia de conducir' },
        ]
      }
    ]
  },
  '/pdf': {
    pageKey: 'pdf',
    fields: [
      { id: 'titulo', label: 'Título de la página', default: 'PDF / Configuración' },
    ]
  },
  '/configuracion': {
    pageKey: 'configuracion',
    fields: [
      { id: 'titulo', label: 'Título de la página', default: 'PDF / Configuración' },
    ]
  },
}

export function detectarPagina(pathname) {
  if (pathname === '/') return pageConfigs['/']
  for (const [route, config] of Object.entries(pageConfigs)) {
    if (route === '/') continue
    if (pathname.startsWith(route)) return config
  }
  return null
}
