import { useCamposFormulario } from '../hooks/useCamposFormulario.js'

const seccionesMeta = {
  datos_personales: { titulo: 'Datos Personales', icono: null },
  contacto: { titulo: 'Información de Contacto', icono: null },
  laboral: { titulo: 'Información Laboral', icono: null },
  emergencia: { titulo: 'Contacto de Emergencia', icono: null },
  uniformes: { titulo: 'Equipo y Uniformes', icono: null },
}

export function useCamposAgrupados() {
  const { data: campos = [], isLoading } = useCamposFormulario()
  const activos = campos.filter(c => c.activo !== false)
  const grupos = {}
  activos.forEach(c => {
    if (!grupos[c.seccion]) grupos[c.seccion] = []
    grupos[c.seccion].push(c)
  })
  Object.keys(grupos).forEach(key => {
    grupos[key].sort((a, b) => (a.orden || 0) - (b.orden || 0))
  })
  return { grupos, secciones: Object.keys(grupos), isLoading }
}

function renderInput(campo, value, onChange) {
  const props = {
    type: campo.tipo === 'tel' ? 'tel' : campo.tipo === 'email' ? 'email' : campo.tipo === 'number' ? 'number' : campo.tipo === 'date' ? 'date' : 'text',
    value: value || '',
    onChange: e => onChange(e.target.value),
    className: 'input-registro',
    placeholder: campo.etiqueta,
  }

  if (campo.tipo === 'select') {
    const opciones = Array.isArray(campo.opciones) ? campo.opciones : []
    return (
      <select className="input-registro" value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">Seleccionar...</option>
        {opciones.map(op => <option key={op} value={op}>{op}</option>)}
      </select>
    )
  }

  if (campo.tipo === 'textarea') {
    return <textarea {...props} className="input-registro textarea-registro" rows={3} />
  }

  if (campo.tipo === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={e => onChange(e.target.checked)}
        className="input-checkbox"
      />
    )
  }

  return <input {...props} />
}

export function GrupoCamposDinamico({ seccion, datos, setDatos, className }) {
  const { grupos } = useCamposAgrupados()
  const campos = grupos[seccion] || []

  if (campos.length === 0) return null

  return (
    <div className={className || 'grid-registro'}>
      {campos.map(campo => (
        <label key={campo.nombre} className="label-registro">
          {campo.etiqueta}
          {campo.obligatorio && <span className="campo-requerido"> *</span>}
          {renderInput(
            campo,
            datos[campo.nombre],
            (val) => setDatos({ ...datos, [campo.nombre]: val })
          )}
        </label>
      ))}
    </div>
  )
}

export function InfoFieldDinamico({ campo, value }) {
  const isEmpty = !value || value === 'N/A' || value === '---' || value === ''
  return (
    <div className={`exp-field ${isEmpty ? 'exp-field-empty' : ''}`}>
      <div className="exp-field-content">
        <span className="exp-field-label">{campo.etiqueta}</span>
        <span className="exp-field-value">{isEmpty ? '---' : value}</span>
      </div>
    </div>
  )
}
