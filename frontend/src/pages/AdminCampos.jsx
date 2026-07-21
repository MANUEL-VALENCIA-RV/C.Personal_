import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCamposFormulario } from '../hooks/useCamposFormulario.js'
import { API, getToken, handleResponse } from '../db/api.js'
import { Plus, Pencil, Trash2, X, AlertTriangle, EyeOff, Eye } from 'lucide-react'
import './AdminEmpresas.css'

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  return handleResponse(res)
}

const seccionesDisponibles = [
  { value: 'datos_personales', label: 'Datos Personales' },
  { value: 'contacto', label: 'Información de Contacto' },
  { value: 'laboral', label: 'Información Laboral' },
  { value: 'emergencia', label: 'Contacto de Emergencia' },
  { value: 'uniformes', label: 'Equipo y Uniformes' },
]

const tiposDisponibles = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'email', label: 'Correo electrónico' },
  { value: 'tel', label: 'Teléfono' },
  { value: 'select', label: 'Lista desplegable' },
  { value: 'checkbox', label: 'Casilla de verificación' },
  { value: 'textarea', label: 'Área de texto' },
]

function seccionLabel(val) {
  return seccionesDisponibles.find(s => s.value === val)?.label || val
}

export default function AdminCampos() {
  const queryClient = useQueryClient()
  const { data: campos = [], isLoading } = useCamposFormulario()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [seccion, setSeccion] = useState('datos_personales')
  const [nombre, setNombre] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [tipo, setTipo] = useState('text')
  const [obligatorio, setObligatorio] = useState(false)
  const [activo, setActivo] = useState(true)
  const [opciones, setOpciones] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  const abrirNuevo = () => {
    setEditando(null)
    setSeccion('datos_personales')
    setNombre('')
    setEtiqueta('')
    setTipo('text')
    setObligatorio(false)
    setActivo(true)
    setOpciones('')
    setError('')
    setMostrarForm(true)
  }

  const abrirEditar = (c) => {
    setEditando(c)
    setSeccion(c.seccion)
    setNombre(c.nombre)
    setEtiqueta(c.etiqueta)
    setTipo(c.tipo)
    setObligatorio(c.obligatorio)
    setActivo(c.activo !== false)
    setOpciones(Array.isArray(c.opciones) ? c.opciones.join('\n') : '')
    setError('')
    setMostrarForm(true)
  }

  const cerrarForm = () => {
    setMostrarForm(false)
    setEditando(null)
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return setError('El nombre interno es obligatorio')
    if (!etiqueta.trim()) return setError('La etiqueta visible es obligatoria')
    setGuardando(true)
    setError('')
    try {
      const body = {
        seccion,
        nombre: nombre.trim(),
        etiqueta: etiqueta.trim(),
        tipo,
        obligatorio,
        activo,
        opciones: tipo === 'select' ? opciones.split('\n').filter(s => s.trim()).map(s => s.trim()) : null,
      }
      if (editando) {
        await api(`/campos/${editando.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await api('/campos', { method: 'POST', body: JSON.stringify(body) })
      }
      queryClient.invalidateQueries({ queryKey: ['campos'] })
      cerrarForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    if (!confirmarEliminar) return
    try {
      await api(`/campos/${confirmarEliminar.id}`, { method: 'DELETE' })
      queryClient.invalidateQueries({ queryKey: ['campos'] })
      setConfirmarEliminar(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const toggleActivo = async (c) => {
    await api(`/campos/${c.id}`, { method: 'PUT', body: JSON.stringify({ activo: !c.activo }) })
    queryClient.invalidateQueries({ queryKey: ['campos'] })
  }

  const grupos = {}
  campos.forEach(c => {
    if (!grupos[c.seccion]) grupos[c.seccion] = []
    grupos[c.seccion].push(c)
  })
  Object.values(grupos).forEach(g => g.sort((a, b) => (a.orden || 0) - (b.orden || 0)))

  return (
    <section className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Campos de Formularios</h1>
          <p className="muted">Administra los campos que aparecen en los formularios de registro y edición</p>
        </div>
        <button type="button" className="btn" onClick={abrirNuevo} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px' }}>
          <Plus size={18} /> Agregar campo
        </button>
      </div>

      {isLoading ? (
        <div className="card"><p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Cargando campos...</p></div>
      ) : (
        seccionesDisponibles.map(sec => {
          const camposSec = grupos[sec.value] || []
          return (
            <div className="card" key={sec.value} style={{ marginTop: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>{sec.label}</h3>
              {camposSec.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sin campos en esta sección</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Nombre interno</th>
                      <th>Etiqueta visible</th>
                      <th>Tipo</th>
                      <th>Obligatorio</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {camposSec.map(c => (
                      <tr key={c.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.orden}</td>
                        <td><code style={{ fontSize: 13, background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 4 }}>{c.nombre}</code></td>
                        <td style={{ fontWeight: 600 }}>{c.etiqueta}</td>
                        <td>{tiposDisponibles.find(t => t.value === c.tipo)?.label || c.tipo}</td>
                        <td>{c.obligatorio ? <span className="badge badge-success">Sí</span> : <span className="badge">No</span>}</td>
                        <td>
                          <button type="button" className="btn2" onClick={() => toggleActivo(c)} title={c.activo ? 'Desactivar' : 'Activar'} style={{ border: 'none', padding: 4 }}>
                            {c.activo ? <Eye size={18} style={{ color: '#22c55e' }} /> : <EyeOff size={18} style={{ color: 'var(--text-muted)' }} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" className="btn2" onClick={() => abrirEditar(c)}><Pencil size={16} /> Editar</button>
                            <button type="button" className="btn2" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setConfirmarEliminar(c)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })
      )}

      {mostrarForm && (
        <div className="modal-overlay" onClick={cerrarForm}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>{editando ? 'Editar campo' : 'Nuevo campo'}</h3>
              <button type="button" className="btn2" onClick={cerrarForm} style={{ border: 'none', padding: 4 }}><X size={20} /></button>
            </div>
            <form onSubmit={guardar}>
              {error && <div className="modal-error" style={{ marginBottom: 16 }}>{error}</div>}
              <label className="modal-label">
                Sección
                <select value={seccion} onChange={e => setSeccion(e.target.value)} style={{ padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 }}>
                  {seccionesDisponibles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label className="modal-label">
                Nombre interno (clave en JSON, no cambiar después de crear)
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: fecha_nacimiento" disabled={!!editando} />
              </label>
              <label className="modal-label">
                Etiqueta visible
                <input type="text" value={etiqueta} onChange={e => setEtiqueta(e.target.value)} placeholder="Ej: Fecha de nacimiento" />
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label className="modal-label" style={{ flex: 1 }}>
                  Tipo de campo
                  <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 }}>
                    {tiposDisponibles.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label className="modal-label" style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                    <input type="checkbox" checked={obligatorio} onChange={e => setObligatorio(e.target.checked)} style={{ width: 18, height: 18 }} />
                    Campo obligatorio
                  </div>
                </label>
              </div>
              {tipo === 'select' && (
                <label className="modal-label">
                  Opciones (una por línea)
                  <textarea value={opciones} onChange={e => setOpciones(e.target.value)} rows={4} style={{ padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }} placeholder="Opción 1&#10;Opción 2&#10;Opción 3" />
                </label>
              )}
              <button type="submit" className="modal-btn" disabled={guardando} style={{ marginTop: 24 }}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear campo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <div className="modal-overlay" onClick={() => setConfirmarEliminar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-icon"><AlertTriangle size={28} /></div>
            <h3 className="modal-titulo">Eliminar campo</h3>
            <p className="modal-desc">
              ¿Estás seguro de eliminar <strong>{confirmarEliminar.etiqueta}</strong>?<br />
              Los datos existentes en registros previos no se perderán, pero el campo dejará de mostrarse.
            </p>
            <div className="modal-acciones">
              <button type="button" className="modal-btn-cancelar" onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
              <button type="button" className="modal-btn-confirmar" onClick={eliminar}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
