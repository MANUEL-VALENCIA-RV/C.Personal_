import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTrabajador, useActualizarTrabajador } from '../hooks/useTrabajadores.js'
import { useCamposFormulario } from '../hooks/useCamposFormulario.js'
import { obtenerTrabajadorActivoId } from '../db/api.js'
import { useCursos, useCrearCurso, useActualizarCurso, useEliminarCurso } from '../hooks/useCursos.js'
import DocumentoDropzone, { documentacionCampos } from '../components/DocumentoDropzone.jsx'
import VisualizadorDocumentos from '../components/VisualizadorDocumentos.jsx'
import CalendarioModal from './CalendarioModal.jsx'
import {
  User, MapPin, Briefcase, Phone, Shirt, FileText, ArrowLeft,
  Calendar as CalendarIcon, Mail, Hash, BadgeCheck, Pencil, Cake,
  Fingerprint, CreditCard, Shield, Heart, Home, Building, Globe,
  HardHat, Eye, StickyNote, AlertTriangle, Package, Star,
  BarChart3, TrendingUp, TrendingDown, Target, BrainCircuit,
  Download, Printer, Plus, RefreshCw, Clock
} from 'lucide-react'
import './Expediente.css'

const tabs = ['Datos Generales', 'Aptitudes', 'Documentación', 'Cursos']

const aptitudesCampos = [
  'Información', 'Juicio', 'Vocabulario', 'Síntesis', 'Concentración',
  'Análisis', 'Abstracción', 'Planeación', 'Organización', 'Atención'
]

const WORKER_PLACEHOLDER = {
  nombre: 'Nombre del Trabajador',
  foto: null,
  empresa: '---',
  puesto: '---',
  area: '---',
  fechaIngreso: '---',
  id: '---',
  estado: '---',
  telefono: '---',
  correo: '---',
  datos_completos: {},
  aptitudes: {},
  resultado_psicometrico: null,
  documentos: {},
  equipo: {},
}

function calcularEdad(fn) {
  if (!fn || fn === 'N/A') return null
  const n = new Date(fn)
  if (isNaN(n.getTime())) return null
  const h = new Date()
  let e = h.getFullYear() - n.getFullYear()
  const m = h.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && h.getDate() < n.getDate())) e--
  return e
}

function InfoField({ icon: Icon, label, value, placeholder }) {
  const isEmpty = !value || value === 'N/A' || value === '---'
  return (
    <div className={`exp-field ${isEmpty ? 'exp-field-empty' : ''}`}>
      <div className="exp-field-icon">{Icon && <Icon size={16} />}</div>
      <div className="exp-field-content">
        <span className="exp-field-label">{label}</span>
        <span className="exp-field-value">{isEmpty ? (placeholder || '---') : value}</span>
      </div>
    </div>
  )
}

function SeccionCard({ titulo, icon: Icon, children, className = '' }) {
  return (
    <div className={`exp-section-card ${className}`}>
      <div className="exp-section-header">
        <div className="exp-section-title">
          {Icon && <Icon size={20} />}
          <h3>{titulo}</h3>
        </div>
      </div>
      <div className="exp-section-body">{children}</div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="exp-kpi-card" style={{ '--kpi-accent': color || 'var(--primary-light)' }}>
      <div className="exp-kpi-icon"><Icon size={20} /></div>
      <div className="exp-kpi-body">
        <span className="exp-kpi-value">{value}</span>
        <span className="exp-kpi-label">{label}</span>
        {sub && <span className="exp-kpi-sub">{sub}</span>}
      </div>
    </div>
  )
}

function RadarChart({ values, labels, hasData }) {
  const size = 300, cx = size / 2, cy = size / 2, radius = size * 0.38
  const count = labels.length
  const levels = [0.25, 0.5, 0.75, 1]
  const maxVal = 10

  const p = (r, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const axes = labels.map((_, i) => -90 + (360 / count) * i)
  const pts = hasData ? values.map((v, i) => p((v / maxVal) * radius, axes[i])) : null

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="exp-radar-svg">
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary-light)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary-light)" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {levels.map(l => (
        <circle key={l} cx={cx} cy={cy} r={radius * l} fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
      ))}
      {axes.map((angle, i) => {
        const ep = p(radius, angle)
        const lp = p(radius + 30, angle)
        let anchor = 'middle'
        if (angle > -80 && angle < 80) anchor = 'start'
        else if (angle > 100 || angle < -100) anchor = 'end'
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={ep.x} y2={ep.y} stroke="var(--border)" strokeWidth="1" />
            <text x={lp.x} y={lp.y} textAnchor={anchor} dominantBaseline="middle" fill="var(--text-muted)" fontSize="9" fontWeight="500">
              {labels[i]}
            </text>
          </g>
        )
      })}
      {hasData && pts && (
        <>
          <polygon points={pts.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="url(#radarGrad)" stroke="var(--primary-light)" strokeWidth="2" />
          {pts.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="var(--primary-light)" stroke="var(--bg-card)" strokeWidth="2" />
          ))}
        </>
      )}
      {!hasData && (
        <circle cx={cx} cy={cy} r="3" fill="var(--text-muted)" opacity="0.4" />
      )}
    </svg>
  )
}

function MiniLineChart({ data }) {
  const w = 200, h = 60, pad = { t: 5, r: 5, b: 20, l: 5 }
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b
  const hasData = data && data.length > 1

  if (!hasData) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="exp-evol-svg">
        <line x1={pad.l} y1={h / 2} x2={w - pad.r} y2={h / 2} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" />
        <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fill="var(--text-muted)" fontSize="9">Sin historial</text>
      </svg>
    )
  }

  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const points = data.map((v, i) => ({
    x: pad.l + (i / (data.length - 1)) * iw,
    y: pad.t + ih - ((v - min) / range) * ih,
  }))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `M${points[0].x},${pad.t + ih}${points.map(p => `L${p.x},${p.y}`).join('')}L${points[points.length - 1].x},${pad.t + ih}Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="exp-evol-svg">
      <path d={area} fill="var(--primary-light)" opacity="0.1" />
      <path d={line} fill="none" stroke="var(--primary-light)" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--primary-light)" />
      ))}
    </svg>
  )
}

function ProgressBar({ label, value, max = 10, color }) {
  const pct = value > 0 ? Math.min((value / max) * 100, 100) : 0
  const hasValue = value > 0
  return (
    <div className="exp-progress-item">
      <div className="exp-progress-header">
        <span className="exp-progress-label">{label}</span>
        <span className="exp-progress-value">{hasValue ? value.toFixed(1) : '---'}</span>
      </div>
      <div className="exp-progress-track">
        <div className="exp-progress-fill" style={{ width: hasValue ? `${pct}%` : '0%', background: color || 'var(--primary-light)' }} />
      </div>
    </div>
  )
}

function SeccionDinamica({ titulo, icon: Icon, seccion, data, campos }) {
  const dc = data.datos_completos || {}
  const d = (c) => { const v = dc[c.nombre]; return (v && v !== '' && v !== 'No registrado' && v !== 'No registradas') ? v : 'N/A' }
  const camposSec = campos.filter(c => c.seccion === seccion && c.activo !== false).sort((a, b) => (a.orden || 0) - (b.orden || 0))
  if (camposSec.length === 0) return null
  return (
    <SeccionCard titulo={titulo} icon={Icon}>
      <div className="exp-grid exp-grid-2col">
        {camposSec.map(c => (
          <InfoField key={c.nombre} icon={null} label={c.etiqueta} value={d(c)} />
        ))}
      </div>
    </SeccionCard>
  )
}

function DatosGenerales({ data }) {
  const { data: campos = [] } = useCamposFormulario()
  const dc = data.datos_completos || {}
  const d = (c) => { const v = dc[c.nombre]; return (v && v !== '' && v !== 'No registrado' && v !== 'No registradas') ? v : 'N/A' }

  const personal = campos.filter(c => c.seccion === 'datos_personales' && c.activo !== false).sort((a, b) => (a.orden || 0) - (b.orden || 0))
  const contacto = campos.filter(c => c.seccion === 'contacto' && c.activo !== false).sort((a, b) => (a.orden || 0) - (b.orden || 0))
  const laboral = campos.filter(c => c.seccion === 'laboral' && c.activo !== false).sort((a, b) => (a.orden || 0) - (b.orden || 0))
  const emergencia = campos.filter(c => c.seccion === 'emergencia' && c.activo !== false).sort((a, b) => (a.orden || 0) - (b.orden || 0))
  const uniformes = campos.filter(c => c.seccion === 'uniformes' && c.activo !== false).sort((a, b) => (a.orden || 0) - (b.orden || 0))

  const edad = calcularEdad(d(campos.find(c => c.nombre === 'Fecha de nacimiento') || {}))

  return (
    <>
      <div className="exp-row-2col">
        <SeccionCard titulo="Información Personal" icon={User}>
          <div className="exp-grid exp-grid-2col">{personal.map(c => <InfoField key={c.nombre} icon={null} label={c.etiqueta} value={d(c)} />)}</div>
        </SeccionCard>
        <SeccionCard titulo="Domicilio" icon={MapPin}>
          <div className="exp-grid exp-grid-2col">{contacto.map(c => <InfoField key={c.nombre} icon={null} label={c.etiqueta} value={d(c)} />)}</div>
        </SeccionCard>
      </div>
      <div className="exp-row-2col">
        <SeccionCard titulo="Información Laboral" icon={Briefcase}>
          <div className="exp-grid exp-grid-1col">{laboral.map(c => <InfoField key={c.nombre} icon={null} label={c.etiqueta} value={d(c)} />)}</div>
        </SeccionCard>
        <SeccionCard titulo="Contacto de Emergencia" icon={Phone}>
          <div className="exp-grid exp-grid-1col">{emergencia.map(c => <InfoField key={c.nombre} icon={null} label={c.etiqueta} value={d(c)} />)}</div>
        </SeccionCard>
      </div>
      {uniformes.length > 0 && (
        <SeccionCard titulo="Uniformes" icon={Shirt}>
          <div className="exp-grid exp-grid-3col">{uniformes.map(c => <InfoField key={c.nombre} icon={null} label={c.etiqueta} value={d(c)} />)}</div>
        </SeccionCard>
      )}
      <SeccionCard titulo="Observaciones Generales" icon={FileText} className="exp-section-obs">
        <div className="exp-obs-content">
          <p>{d({ nombre: 'Observaciones' }) !== 'N/A' ? d({ nombre: 'Observaciones' }) : 'Sin observaciones registradas.'}</p>
          {d({ nombre: 'Padecimiento médico' }) !== 'N/A' && (
            <div className="exp-obs-alert"><AlertTriangle size={16} /><span>Padecimiento médico: {d({ nombre: 'Padecimiento médico' })}</span></div>
          )}
        </div>
      </SeccionCard>
    </>
  )
}



function fechaSegura(valor) {
  if (!valor || valor === '---' || valor === 'N/A') return null
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function formatearFecha(valor) {
  const fecha = fechaSegura(valor)
  if (!fecha) return 'Sin fecha'
  return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
}

function CursosContent({ trabajadorId }) {
  const { data = [], isLoading } = useCursos(trabajadorId)
  const crearMutation = useCrearCurso()
  const actualizarMutation = useActualizarCurso()
  const eliminarMutation = useEliminarCurso()
  const [curso, setCurso] = useState('')
  const [fecha, setFecha] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [cursoEditado, setCursoEditado] = useState('')
  const [fechaEditada, setFechaEditada] = useState('')

  const cursos = Array.isArray(data) ? data : []

  const guardar = async (e) => {
    e.preventDefault()
    const limpio = curso.trim()
    if (!limpio) return

    await crearMutation.mutateAsync({
      trabajadorId,
      data: {
        curso: limpio,
        fecha: fecha || null,
      },
    })

    setCurso('')
    setFecha('')
  }

  const iniciarEdicion = (item) => {
    setEditandoId(item.id)
    setCursoEditado(item.curso || '')
    setFechaEditada(item.fecha ? String(item.fecha).slice(0, 10) : '')
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setCursoEditado('')
    setFechaEditada('')
  }

  const guardarEdicion = async (item) => {
    const limpio = cursoEditado.trim()
    if (!limpio) return

    await actualizarMutation.mutateAsync({
      trabajadorId,
      cursoId: item.id,
      data: {
        curso: limpio,
        fecha: fechaEditada || null,
      },
    })

    cancelarEdicion()
  }

  const eliminar = async (item) => {
    if (!confirm(`¿Eliminar el curso "${item.curso}"?`)) return
    await eliminarMutation.mutateAsync({ trabajadorId, cursoId: item.id })
  }

  return (
    <SeccionCard titulo="Cursos del trabajador" icon={BadgeCheck}>
      <form className="exp-obs-form" onSubmit={guardar}>
        <div className="exp-grid exp-grid-2col">
          <div>
            <label className="exp-field-label">Curso</label>
            <input
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              placeholder="Ej. Trabajo en alturas"
            />
          </div>
          <div>
            <label className="exp-field-label">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div className="exp-obs-form-footer">
          <span className="exp-empty-text">Registra solo los cursos que ya tiene el trabajador.</span>
          <button type="submit" className="exp-action-btn exp-action-primary" disabled={crearMutation.isPending || !curso.trim()}>
            <Plus size={16} /> Agregar curso
          </button>
        </div>
      </form>

      <div className="exp-obs-list">
        {isLoading && <p className="exp-empty-text">Cargando cursos...</p>}
        {!isLoading && cursos.length === 0 && <p className="exp-empty-text">Sin cursos registrados.</p>}

        {cursos.map((item) => (
          <div key={item.id} className="exp-obs-item">
            {editandoId === item.id ? (
              <div className="exp-obs-edit-box">
                <div className="exp-grid exp-grid-2col">
                  <input value={cursoEditado} onChange={(e) => setCursoEditado(e.target.value)} placeholder="Nombre del curso" />
                  <input type="date" value={fechaEditada} onChange={(e) => setFechaEditada(e.target.value)} />
                </div>
                <div className="exp-obs-actions">
                  <button type="button" className="exp-action-btn" onClick={cancelarEdicion}>Cancelar</button>
                  <button type="button" className="exp-action-btn exp-action-primary" onClick={() => guardarEdicion(item)}>Guardar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="exp-obs-item-head">
                  <strong>{item.curso}</strong>
                  <span className="exp-obs-date">{formatearFecha(item.fecha)}</span>
                </div>
                <div className="exp-obs-actions">
                  <button type="button" className="exp-action-btn" onClick={() => iniciarEdicion(item)}>Editar</button>
                  <button type="button" className="exp-action-btn exp-action-danger" onClick={() => eliminar(item)}>Eliminar</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </SeccionCard>
  )
}

function AptitudesContent({ data, navigate }) {
  const aptitudes = data.aptitudes || {}
  const resultado = data.resultado_psicometrico

  const rawValues = aptitudesCampos.map(c => Number(aptitudes[c]) || 0)
  const hasAptitudes = rawValues.some(v => v > 0)

  const valuesForDisplay = rawValues.map(v => (v > 10 ? v / 10 : v))
  const displayMax = 10

  const promedio = hasAptitudes ? valuesForDisplay.reduce((a, b) => a + b, 0) / valuesForDisplay.length : 0
  const maxVal = hasAptitudes ? Math.max(...valuesForDisplay) : 0
  const nonZero = valuesForDisplay.filter(v => v > 0)
  const minVal = hasAptitudes && nonZero.length > 0 ? Math.min(...nonZero) : 0
  const maxIdx = hasAptitudes ? valuesForDisplay.indexOf(maxVal) : -1
  const minIdx = hasAptitudes && nonZero.length > 0 ? valuesForDisplay.indexOf(minVal) : -1

  const nivelGeneral = (() => {
    if (!hasAptitudes) return '---'
    if (promedio >= 8) return 'Alto'
    if (promedio >= 6) return 'Medio'
    return 'Bajo'
  })()

  const fortalezas = hasAptitudes
    ? aptitudesCampos.filter((_, i) => valuesForDisplay[i] >= 7).map(c => ({ aptitud: c, valor: valuesForDisplay[aptitudesCampos.indexOf(c)] }))
    : []
  const areasMejora = hasAptitudes
    ? aptitudesCampos.filter((_, i) => valuesForDisplay[i] < 6 && valuesForDisplay[i] > 0).map(c => ({ aptitud: c, valor: valuesForDisplay[aptitudesCampos.indexOf(c)] }))
    : []

  const getColor = (v) => {
    if (v >= 8) return '#22c55e'
    if (v >= 6) return '#eab308'
    return '#ef4444'
  }

  const historial = useMemo(() => {
    if (resultado && resultado.fecha_evaluacion) {
      return [{ fecha: resultado.fecha_evaluacion, promedio: promedio.toFixed(1), evaluador: 'Sistema' }]
    }
    return []
  }, [resultado, promedio])

  return (
    <>
      <div className="exp-kpi-grid">
        <KpiCard icon={BarChart3} label="Promedio General" value={hasAptitudes ? promedio.toFixed(1) : '---'} sub={hasAptitudes ? '/ 10' : null} color="#3b82f6" />
        <KpiCard icon={TrendingUp} label="Aptitud Más Alta" value={hasAptitudes ? maxVal.toFixed(1) : '---'} sub={hasAptitudes && maxIdx >= 0 ? aptitudesCampos[maxIdx] : null} color="#22c55e" />
        <KpiCard icon={TrendingDown} label="Aptitud Más Baja" value={hasAptitudes ? minVal.toFixed(1) : '---'} sub={hasAptitudes && minIdx >= 0 ? aptitudesCampos[minIdx] : null} color="#ef4444" />
        <KpiCard icon={Target} label="Nivel General" value={nivelGeneral} sub={hasAptitudes ? `CI: ${resultado?.ci_obtenido || '---'}` : null} color="#a78bfa" />
      </div>

      <div className="exp-row-2col">
        <SeccionCard titulo="Análisis de Aptitudes" icon={BrainCircuit}>
          <div className="exp-radar-container">
            <RadarChart values={valuesForDisplay} labels={aptitudesCampos} hasData={hasAptitudes} />
          </div>
        </SeccionCard>

        <SeccionCard titulo="Resultados Detallados" icon={BarChart3}>
          <div className="exp-progress-list">
            {aptitudesCampos.map((c, i) => (
              <ProgressBar key={c} label={c} value={valuesForDisplay[i]} max={displayMax} color={getColor(valuesForDisplay[i])} />
            ))}
          </div>
        </SeccionCard>
      </div>

      <SeccionCard titulo="Escala de Evaluación" icon={Target}>
        <div className="exp-scale-row">
          <div className="exp-scale-item exp-scale-alto">
            <span className="exp-scale-range">8.0 - 10</span>
            <span className="exp-scale-label">Alto</span>
            <span className="exp-scale-desc">Rendimiento sobresaliente</span>
          </div>
          <div className="exp-scale-item exp-scale-medio">
            <span className="exp-scale-range">6.0 - 7.9</span>
            <span className="exp-scale-label">Medio</span>
            <span className="exp-scale-desc">Rendimiento estándar</span>
          </div>
          <div className="exp-scale-item exp-scale-bajo">
            <span className="exp-scale-range">0 - 5.9</span>
            <span className="exp-scale-label">Bajo</span>
            <span className="exp-scale-desc">Requiere atención</span>
          </div>
        </div>
      </SeccionCard>

      <SeccionCard titulo="Interpretación General" icon={FileText}>
        <div className="exp-interp-grid">
          <div className="exp-interp-col exp-interp-fort">
            <div className="exp-interp-header">
              <TrendingUp size={16} />
              <span>Fortalezas</span>
            </div>
            {fortalezas.length > 0 ? (
              <ul className="exp-interp-list">
                {fortalezas.map((f, i) => <li key={i}>{f.aptitud} <strong>({f.valor.toFixed(1)})</strong></li>)}
              </ul>
            ) : (
              <p className="exp-interp-empty">Sin datos disponibles</p>
            )}
          </div>
          <div className="exp-interp-col exp-interp-mej">
            <div className="exp-interp-header">
              <TrendingDown size={16} />
              <span>Áreas de mejora</span>
            </div>
            {areasMejora.length > 0 ? (
              <ul className="exp-interp-list">
                {areasMejora.map((a, i) => <li key={i}>{a.aptitud} <strong>({a.valor.toFixed(1)})</strong></li>)}
              </ul>
            ) : (
              <p className="exp-interp-empty">{hasAptitudes ? 'Sin áreas de mejora detectadas' : 'Sin datos disponibles'}</p>
            )}
          </div>
          <div className="exp-interp-col exp-interp-rec">
            <div className="exp-interp-header">
              <Star size={16} />
              <span>Recomendación</span>
            </div>
            {hasAptitudes ? (
              <p className="exp-interp-text">
                {promedio >= 8 ? 'El trabajador presenta un desempeño sobresaliente en sus aptitudes. Se recomienda considerar proyectos de mayor responsabilidad y programas de desarrollo avanzado.' :
                 promedio >= 6 ? 'El trabajador muestra un desempeño adecuado. Se sugiere reforzar las áreas de mejora mediante capacitación específica y seguimiento continuo.' :
                 'Se recomienda implementar un plan de desarrollo integral con capacitación focalizada en las aptitudes con menor puntuación y evaluaciones periódicas de seguimiento.'}
              </p>
            ) : (
              <p className="exp-interp-empty">Sin datos disponibles</p>
            )}
          </div>
        </div>
      </SeccionCard>

      <SeccionCard titulo="Historial de Evaluaciones" icon={CalendarIcon}>
        <div className="exp-history-grid">
          <div className="exp-history-table-wrap">
            <table className="exp-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Promedio</th>
                  <th>Evaluador</th>
                </tr>
              </thead>
              <tbody>
                {historial.length > 0 ? historial.map((h, i) => (
                  <tr key={i}>
                    <td>{h.fecha}</td>
                    <td><span className="exp-badge-exp">{h.promedio}</span></td>
                    <td>{h.evaluador}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="exp-table-empty">No hay evaluaciones registradas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="exp-evol-card">
            <span className="exp-evol-title">Evolución de rendimiento</span>
            <MiniLineChart data={historial.map(h => parseFloat(h.promedio))} />
          </div>
        </div>
      </SeccionCard>

    </>
  )
}

export default function Expediente() {
  const { id: urlId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [editDocs, setEditDocs] = useState({})
  const [mostrarCalendario, setMostrarCalendario] = useState(false)

  const idParaCargar = urlId || obtenerTrabajadorActivoId()
  const { data: trabajador, isLoading } = useTrabajador(idParaCargar)
  const actualizarMutation = useActualizarTrabajador()

  useEffect(() => {
    if (trabajador?.documentos) {
      setEditDocs(trabajador.documentos)
    }
  }, [trabajador])

  const data = trabajador || WORKER_PLACEHOLDER
  const isEmpty = !trabajador

  const guardarCambiosDocumentos = async () => {
    if (!trabajador) return
    await actualizarMutation.mutateAsync({ id: trabajador.id, data: { documentos: editDocs } })
    alert('Documentación actualizada y guardada.')
  }

  if (isLoading) return null

  const iniciales = (data.nombre || '')
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <section className="exp-page">
      <div className="exp-header">
        <div className="exp-header-left">
          <h1 className="exp-title">Expediente del Trabajador</h1>
          <p className="exp-subtitle">Consulta y administración de la información del trabajador</p>
        </div>
        <button type="button" className="exp-btn-back" onClick={() => navigate('/trabajadores')}>
          <ArrowLeft size={16} /> Regresar
        </button>
      </div>

      <div className="exp-profile">
        <div className="exp-profile-avatar">
          {data.foto ? (
            <img src={data.foto} alt={data.nombre} />
          ) : (
            <span className="exp-profile-initials">{iniciales}</span>
          )}
          <div className="exp-profile-status-dot" />
        </div>
        <div className="exp-profile-info">
          <h2 className="exp-profile-name">{data.nombre || 'Nombre del Trabajador'}</h2>
          <div className="exp-profile-tags">
            <span className="exp-tag exp-tag-primary">{data.puesto || '---'}</span>
            <span className="exp-tag exp-tag-secondary">{data.area || data.datos_completos?.['Área'] || '---'}</span>
            <span className="exp-tag exp-tag-accent">{data.empresa || '---'}</span>
            <span className="exp-tag exp-tag-success"><BadgeCheck size={14} />{data.estado || 'Activo'}</span>
          </div>
          <div className="exp-profile-meta">
            <div className="exp-meta-item"><CalendarIcon size={14} /><span>Ingreso: {data.fechaIngreso || '---'}</span></div>
            <div className="exp-meta-item"><Hash size={14} /><span>ID: #{data.id || '---'}</span></div>
            <div className="exp-meta-item"><Clock size={14} /><span>Actualizado: {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'}</span></div>
          </div>
        </div>
        <div className="exp-profile-actions">
          <button type="button" className="exp-btn-edit" disabled={isEmpty} onClick={() => navigate('/editar/' + data.id)}><Pencil size={16} />Editar Información</button>
          {data.id && data.id !== '---' && (
            <>
            <button type="button" className="exp-btn-edit exp-btn-pdf" onClick={() => navigate(`/pdf/${data.id}`)}><Download size={16} />PDF</button>
            <button type="button" className="exp-btn-edit" disabled={isEmpty} onClick={() => setMostrarCalendario(true)}><CalendarIcon size={16} />Calendario</button>
            <button
              type="button"
              className="exp-btn-edit"
              style={{ borderColor: data.estado === 'Activo' ? '#ef4444' : '#22c55e', color: data.estado === 'Activo' ? '#ef4444' : '#22c55e' }}
              disabled={isEmpty}
              onClick={async () => {
                const nuevoEstado = data.estado === 'Activo' ? 'Inactivo' : 'Activo'
                const accion = nuevoEstado === 'Inactivo' ? 'dar de baja' : 'activar'
                if (!confirm(`¿Estás seguro de ${accion} a ${data.nombre}?`)) return
                await actualizarMutation.mutateAsync({ id: data.id, data: { estado: nuevoEstado } })
              }}
            >
              {data.estado === 'Activo' ? 'Dar de baja' : 'Activar'}
            </button>
            </>
          )}
        </div>
      </div>

      <div className="exp-tabs">
        {tabs.map((t, i) => (
          <button key={t} type="button" className={`exp-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && <div className="exp-content"><DatosGenerales data={data} /></div>}
      {tab === 1 && <div className="exp-content"><AptitudesContent data={data} navigate={navigate} /></div>}
      {tab === 2 && (
        <div className="exp-content">
          <SeccionCard titulo="Documentos Guardados" icon={Eye}>
            <p className="exp-section-desc">Visualiza o descarga los documentos que ya fueron cargados para este trabajador.</p>
            <VisualizadorDocumentos documentos={data.documentos} campos={documentacionCampos} />
          </SeccionCard>

          <SeccionCard titulo="Archivo Digital de Documentos" icon={FileText}>
            <p className="exp-section-desc">Arrastra los archivos directamente a cada sección.</p>
            <div className="docs-upload-grid">
              {documentacionCampos.map((campo) => (
                <DocumentoDropzone key={campo} campo={campo} file={editDocs[campo]} onFileChange={(c, f) => setEditDocs({ ...editDocs, [c]: f })} />
              ))}
            </div>
            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button type="button" className="exp-action-btn exp-action-primary" onClick={guardarCambiosDocumentos} disabled={isEmpty}>
                Guardar Documentación
              </button>
            </div>
          </SeccionCard>
        </div>
      )}

      {tab === 3 && (
        <div className="exp-content">
          {data.id && data.id !== '---' ? (
            <CursosContent trabajadorId={data.id} />
          ) : (
            <SeccionCard titulo="Cursos" icon={BadgeCheck}>
              <p className="exp-empty-text">Selecciona un trabajador para ver sus cursos.</p>
            </SeccionCard>
          )}
        </div>
      )}


      {mostrarCalendario && (
        <CalendarioModal
          trabajador={data}
          onClose={() => setMostrarCalendario(false)}
        />
      )}
    </section>
  )
}
