const API = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('auth_token')
}

function authHeaders() {
  const token = getToken()
  return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' }
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_usuario')
    window.location.href = '/#/login'
    throw new Error('Sesión expirada')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error en la solicitud')
  }

  return res.json()
}

export const login = async (email, password) => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await handleResponse(res)

  localStorage.setItem('auth_token', data.token)

  const usuarioConCambio = {
    ...data.usuario,
    cambiarPassword: data.cambiarPassword,
  }

  localStorage.setItem('auth_usuario', JSON.stringify(usuarioConCambio))

  return {
    ...data,
    usuario: usuarioConCambio,
  }
}

export const verificarSesion = async () => {
  const res = await fetch(`${API}/auth/verify`, {
    headers: authHeaders(),
  })

  const data = await handleResponse(res)
  return data.usuario
}

export const registrarUsuario = async (email, password, nombre) => {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nombre }),
  })

  const data = await handleResponse(res)

  localStorage.setItem('auth_token', data.token)
  localStorage.setItem('auth_usuario', JSON.stringify(data.usuario))

  return data
}

export const cambiarPassword = async (passwordActual, passwordNueva) => {
  const res = await fetch(`${API}/auth/cambiar-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ passwordActual, passwordNueva }),
  })

  const data = await handleResponse(res)

  const usuarioActual = obtenerUsuarioActual()

  if (usuarioActual) {
    localStorage.setItem(
        'auth_usuario',
        JSON.stringify({
          ...usuarioActual,
          cambiarPassword: false,
        })
    )
  }

  return data
}

export const cerrarSesion = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_usuario')
}

export const obtenerUsuarioActual = () => {
  const data = localStorage.getItem('auth_usuario')
  return data ? JSON.parse(data) : null
}

export const obtenerTrabajadores = async (params = {}) => {
  const query = new URLSearchParams()

  if (params.q) query.set('q', params.q)
  if (params.estado && params.estado !== 'Todas') query.set('estado', params.estado)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)

  const url = `${API}/trabajadores${query.toString() ? '?' + query.toString() : ''}`

  const res = await fetch(url, {
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const obtenerTrabajadorPorId = async (id) => {
  const res = await fetch(`${API}/trabajadores/${id}`, {
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const agregarTrabajador = async (data) => {
  const res = await fetch(`${API}/trabajadores`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  return handleResponse(res)
}

export const actualizarTrabajador = async (id, data) => {
  const res = await fetch(`${API}/trabajadores/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  return handleResponse(res)
}

export const eliminarTrabajador = async (id) => {
  const res = await fetch(`${API}/trabajadores/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const calcularTerman = (aptitudes) => {
  const campos = [
    'Información',
    'Juicio',
    'Vocabulario',
    'Síntesis',
    'Concentración',
    'Análisis',
    'Abstracción',
    'Planeación',
    'Organización',
    'Atención',
  ]

  let aciertosTotales = 0
  const totalPosible = campos.length * 100

  campos.forEach((campo) => {
    aciertosTotales += Number(aptitudes[campo] || 0)
  })

  const ratioExito = aciertosTotales / totalPosible

  let ci = 70 + Math.round(ratioExito * 70)

  if (ci > 140) ci = 140
  if (ci < 60) ci = 60

  let rango = 'Término Medio (Normal)'

  if (ci >= 140) rango = 'Sobresaliente / Genio'
  else if (ci >= 120) rango = 'Superior'
  else if (ci >= 110) rango = 'Término Medio Alto'
  else if (ci >= 90) rango = 'Término Medio (Normal)'
  else if (ci >= 80) rango = 'Término Medio Bajo'
  else if (ci >= 70) rango = 'Fronterizo (Inferior)'
  else rango = 'Deficiente'

  return {
    ci_obtenido: ci,
    rango_capacidad: rango,
    fecha_evaluacion: new Date().toISOString().split('T')[0],
  }
}

export const establecerTrabajadorActivo = (id) => {
  localStorage.setItem('vdt_trabajador_activo_id', id)
}

export const obtenerTrabajadorActivoId = () => {
  return localStorage.getItem('vdt_trabajador_activo_id')
}

export const obtenerObservacionesTrabajador = async (trabajadorId) => {
  const res = await fetch(`${API}/observaciones?trabajadorId=${trabajadorId}`, {
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const crearObservacionTrabajador = async (trabajadorId, data) => {
  const res = await fetch(`${API}/observaciones`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, trabajadorId }),
  })

  return handleResponse(res)
}

export const actualizarObservacionTrabajador = async (trabajadorId, observacionId, data) => {
  const res = await fetch(`${API}/observaciones/${observacionId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  return handleResponse(res)
}

export const eliminarObservacionTrabajador = async (trabajadorId, observacionId) => {
  const res = await fetch(`${API}/observaciones/${observacionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const obtenerCursosTrabajador = async (trabajadorId) => {
  const res = await fetch(`${API}/cursos-trabajador?trabajadorId=${trabajadorId}`, {
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const crearCursoTrabajador = async (trabajadorId, data) => {
  const res = await fetch(`${API}/cursos-trabajador`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...data, trabajadorId }),
  })

  return handleResponse(res)
}

export const actualizarCursoTrabajador = async (trabajadorId, cursoId, data) => {
  const res = await fetch(`${API}/cursos-trabajador/${cursoId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  return handleResponse(res)
}

export const eliminarCursoTrabajador = async (trabajadorId, cursoId) => {
  const res = await fetch(`${API}/cursos-trabajador/${cursoId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const obtenerEventosCalendario = async (params = {}) => {
  const query = new URLSearchParams()

  if (params.trabajadorId) query.set('trabajadorId', params.trabajadorId)

  const url = `${API}/calendario${query.toString() ? '?' + query.toString() : ''}`

  const res = await fetch(url, {
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const crearEventoCalendario = async (data) => {
  const res = await fetch(`${API}/calendario`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  return handleResponse(res)
}

export const eliminarEventoCalendario = async (id) => {
  const res = await fetch(`${API}/calendario/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const subirDocumento = async (trabajadorId, file) => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API}/documentos/${trabajadorId}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  })

  return handleResponse(res)
}

export const obtenerDocumentos = async (trabajadorId) => {
  const res = await fetch(`${API}/documentos/${trabajadorId}`, {
    headers: authHeaders(),
  })

  return handleResponse(res)
}

export const eliminarDocumento = async (documentoId) => {
  const res = await fetch(`${API}/documentos/${documentoId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  return handleResponse(res)
}