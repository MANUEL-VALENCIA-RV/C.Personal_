import { useState } from 'react'
import { Edit3, X, Plus, Trash2, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react'
import './PageEditor.css'

const STORE = 'vdt_page_labels'

function cargar(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : {} } catch { return {} }
}
function guardar(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function usePageLabels(pageKey, defaults = {}) {
  const all = cargar(STORE)
  return { ...defaults, ...(all[pageKey] || {}) }
}

export function EditarBtn({ onClick }) {
  return (
    <>
      <button type="button" className="pe-btn-floating" onClick={onClick} title="Editar página">
        <Edit3 size={18} />
      </button>
      <span className="pe-btn-label">Editar página</span>
    </>
  )
}

function CampoTexto({ id, valor, onChange, placeholder, peligro }) {
  return (
    <div className="pe-peligro-row">
      <input
        type="text"
        value={valor || ''}
        onChange={e => onChange(id, e.target.value)}
        className={`pe-input ${peligro ? 'pe-input-peligro' : ''}`}
        placeholder={placeholder || ''}
      />
      {peligro && (
        <button type="button" className="pe-btn-peligro" onClick={() => alert('Por favor no modicar (contacte con Manuel para modificar el sistema)')} title="Operación crítica">
          <AlertTriangle size={16} />
        </button>
      )}
    </div>
  )
}

function CampoColor({ id, valor, onChange }) {
  return (
    <div className="pe-color-row">
      <input
        type="color"
        value={valor || '#3b82f6'}
        onChange={e => onChange(id, e.target.value)}
        className="pe-color-input"
      />
      <input
        type="text"
        value={valor || '#3b82f6'}
        onChange={e => onChange(id, e.target.value)}
        className="pe-input"
      />
    </div>
  )
}

export default function PageEditor({ pageKey, fields = [], lists = [], onClose }) {
  const allLabels = cargar(STORE)
  const pageData = allLabels[pageKey] || {}

  const [datos, setDatos] = useState(() => {
    const merged = {}
    fields.forEach(f => {
      merged[f.id] = pageData[f.id] !== undefined ? pageData[f.id] : f.default || ''
    })
    return merged
  })

  const [listas, setListas] = useState(() => {
    const merged = {}
    lists.forEach(list => {
      merged[list.id] = pageData[list.id] || list.defaults || []
    })
    return merged
  })

  const cambiar = (id, valor) => setDatos(prev => ({ ...prev, [id]: valor }))

  const cambiarItemLista = (listId, index, campo, valor) => {
    setListas(prev => {
      const copia = { ...prev }
      const items = [...copia[listId]]
      items[index] = { ...items[index], [campo]: valor }
      copia[listId] = items
      return copia
    })
  }

  const agregarItem = (listId, template) => {
    setListas(prev => {
      const copia = { ...prev }
      copia[listId] = [...copia[listId], { ...template }]
      return copia
    })
  }

  const eliminarItem = (listId, index) => {
    setListas(prev => {
      const copia = { ...prev }
      copia[listId] = copia[listId].filter((_, i) => i !== index)
      return copia
    })
  }

  const moverItem = (listId, index, direccion) => {
    setListas(prev => {
      const copia = { ...prev }
      const items = [...copia[listId]]
      const target = index + direccion
      if (target < 0 || target >= items.length) return prev
      const temp = items[index]
      items[index] = items[target]
      items[target] = temp
      copia[listId] = items
      return copia
    })
  }

  const guardarCambios = () => {
    const all = cargar(STORE)
    all[pageKey] = { ...all[pageKey], ...datos }
    lists.forEach(list => {
      const items = (listas[list.id] || []).map(item => ({
        ...item,
        dbValue: item.dbValue || item.label,
        label: item.label || item.dbValue || '',
      }))
      all[pageKey][list.id] = items
    })
    guardar(STORE, all)
    onClose()
    window.location.reload()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pe-modal" onClick={e => e.stopPropagation()}>
        <div className="pe-header">
          <Edit3 size={18} />
          <h3>Editar página</h3>
          <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Campos simples */}
        {fields.map(f => (
          <div key={f.id} className="pe-campo">
            <label className="pe-label">{f.label}</label>
            {f.tipo === 'color' ? (
              <CampoColor id={f.id} valor={datos[f.id]} onChange={cambiar} />
            ) : (
              <CampoTexto id={f.id} valor={datos[f.id]} onChange={cambiar} placeholder={f.placeholder} peligro={f.peligro} />
            )}
            {f.desc && <span className="pe-desc-campo">{f.desc}</span>}
          </div>
        ))}

        {/* Listas editables */}
        {lists.map(list => (
          <div key={list.id} className="pe-seccion">
            <div className="pe-seccion-header">
              <label className="pe-label">{list.titulo}</label>
              <button type="button" className="pe-btn-add-item" onClick={() => agregarItem(list.id, list.template)}>
                <Plus size={14} /> Agregar
              </button>
            </div>
            {list.desc && <span className="pe-desc-campo" style={{ marginBottom: 8 }}>{list.desc}</span>}
            {listas[list.id].length === 0 && <p className="pe-vacio">Sin elementos</p>}
            {listas[list.id].map((item, i) => (
              <div key={i} className="pe-item-card">
                <div className="pe-item-card-header">
                  <div className="pe-item-card-order">
                    <button type="button" className="pe-btn-icon" onClick={() => moverItem(list.id, i, -1)} disabled={i === 0} title="Subir">
                      <ChevronUp size={14} />
                    </button>
                    <span className="pe-item-num">{i + 1}</span>
                    <button type="button" className="pe-btn-icon" onClick={() => moverItem(list.id, i, 1)} disabled={i === listas[list.id].length - 1} title="Bajar">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <button type="button" className="pe-btn-icon pe-btn-icon-danger" onClick={() => eliminarItem(list.id, i)} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
                {list.campos.map(campo => (
                  <div key={campo.id} className="pe-campo" style={{ marginTop: 6 }}>
                    <label className="pe-label" style={{ fontSize: 11 }}>{campo.label}</label>
                    {campo.tipo === 'color' ? (
                      <CampoColor id={null} valor={item[campo.id]} onChange={(_, val) => cambiarItemLista(list.id, i, campo.id, val)} />
                    ) : (
                      <input
                        type="text"
                        value={item[campo.id] || ''}
                        onChange={e => cambiarItemLista(list.id, i, campo.id, e.target.value)}
                        className="pe-input"
                        placeholder={campo.placeholder || ''}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        <div className="pe-footer">
          <button type="button" className="modal-btn-cancelar" onClick={onClose}>Cancelar</button>
          <button type="button" className="pe-btn-guardar" onClick={guardarCambios}>Guardar cambios</button>
        </div>
      </div>
    </div>
  )
}
