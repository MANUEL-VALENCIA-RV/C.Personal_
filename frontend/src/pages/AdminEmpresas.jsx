import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useEmpresas } from '../hooks/useEmpresas.js'
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

const colores = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']

export default function AdminEmpresas() {
  const queryClient = useQueryClient()
  const { data: empresas = [], isLoading } = useEmpresas()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  const abrirNuevo = () => {
    setEditando(null)
    setNombre('')
    setColor('#3b82f6')
    setError('')
    setMostrarForm(true)
  }

  const abrirEditar = (emp) => {
    setEditando(emp)
    setNombre(emp.label)
    setColor(emp.color)
    setError('')
    setMostrarForm(true)
  }

  const cerrarForm = () => {
    setMostrarForm(false)
    setEditando(null)
    setNombre('')
    setColor('#3b82f6')
    setError('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return setError('El nombre es obligatorio')
    setGuardando(true)
    setError('')
    try {
      if (editando) {
        await api(`/empresas/${editando.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nombre: nombre.trim(), color }),
        })
      } else {
        await api('/empresas', {
          method: 'POST',
          body: JSON.stringify({ nombre: nombre.trim(), color }),
        })
      }
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
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
      await api(`/empresas/${confirmarEliminar.id}`, { method: 'DELETE' })
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      setConfirmarEliminar(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const toggleActivo = async (emp) => {
    await api(`/empresas/${emp.id}`, { method: 'PUT', body: JSON.stringify({ activa: emp.activa === false ? true : false }) })
    queryClient.invalidateQueries({ queryKey: ['empresas'] })
  }

  return (
    <section className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Administrar Empresas</h1>
          <p className="muted">Gestiona las empresas registradas en el sistema</p>
        </div>
        <button type="button" className="btn" onClick={abrirNuevo} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px' }}>
          <Plus size={18} /> Agregar empresa
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Cargando empresas...</p>
        ) : empresas.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No hay empresas registradas.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Activa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: emp.color, border: '2px solid var(--border)' }} />
                  </td>
                  <td style={{ fontWeight: 600 }}>{emp.label}</td>
                  <td>
                    <span className={`badge ${emp.activa !== false ? 'badge-success' : 'badge-danger'}`}>
                      {emp.activa !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn2" onClick={() => toggleActivo(emp)} title={emp.activa !== false ? 'Desactivar' : 'Activar'} style={{ border: 'none', padding: 4 }}>
                      {emp.activa !== false ? <Eye size={18} style={{ color: '#22c55e' }} /> : <EyeOff size={18} style={{ color: 'var(--text-muted)' }} />}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn2" onClick={() => abrirEditar(emp)}>
                        <Pencil size={16} /> Editar
                      </button>
                      <button
                        type="button"
                        className="btn2"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => setConfirmarEliminar(emp)}
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {mostrarForm && (
        <div className="modal-overlay" onClick={cerrarForm}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>{editando ? 'Editar empresa' : 'Nueva empresa'}</h3>
              <button type="button" className="btn2" onClick={cerrarForm} style={{ border: 'none', padding: 4 }}><X size={20} /></button>
            </div>
            <form onSubmit={guardar}>
              {error && <div className="modal-error" style={{ marginBottom: 16 }}>{error}</div>}
              <label className="modal-label">
                Nombre de la empresa
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: VDT" autoFocus />
              </label>
              <label className="modal-label" style={{ marginTop: 16 }}>
                Color
                <div className="admin-color-grid">
                  {colores.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`admin-color-btn ${color === c ? 'admin-color-active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </label>
              <button type="submit" className="modal-btn" disabled={guardando} style={{ marginTop: 24 }}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear empresa'}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <div className="modal-overlay" onClick={() => setConfirmarEliminar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-icon"><AlertTriangle size={28} /></div>
            <h3 className="modal-titulo">Eliminar empresa</h3>
            <p className="modal-desc">
              ¿Estás seguro de eliminar <strong>{confirmarEliminar.label}</strong>?<br />
              Esta acción no se puede deshacer.
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
