import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { obtenerTrabajadorPorId } from '../db/api.js'
import { ArrowLeft, Download } from 'lucide-react'

import './Expediente.css'

const APT_LABELS = [
  'Información', 'Juicio', 'Vocabulario', 'Síntesis', 'Concentración',
  'Análisis', 'Abstracción', 'Planeación', 'Organización', 'Atención',
]

const AZUL_MARINO = '#0F2E6E'
const AZUL_CORP = '#1E4D9B'
const GRIS_CLARO = '#F5F7FA'
const GRIS_MEDIO = '#DCE3EB'
const ROJO_APT = '#C62828'

const DATOS_FIELDS = [
  { label: 'Fecha de nacimiento', key: 'Fecha de nacimiento' },
  { label: 'CURP', key: 'CURP' },
  { label: 'RFC', key: 'RFC' },
  { label: 'NSS', key: 'NSS' },
  { label: 'Teléfono personal', key: 'Teléfono personal' },
  { label: 'Correo personal', key: 'Correo personal' },
]

const LABORAL_FIELDS = [
  { label: 'Empresa', key: '__empresa__' },
  { label: 'Área', key: '__area__' },
  { label: 'Puesto', key: '__puesto__' },
  { label: 'Fecha de ingreso', key: '__fechaIngreso__' },
  { label: 'Correo empresarial', key: 'Correo empresarial' },
]


function folio() {
  const d = new Date()
  return `RH-${d.getFullYear()}-${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}
function hasValue(v) {
  if (v === null || v === undefined) return false
  if (typeof v === 'string' && (v === '' || v === '—' || v === 'N/A' || v === '---')) return false
  return true
}

function RadarChart({ values, labels, size = 160, max = 10 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.35
  const n = labels.length
  const angleStep = (2 * Math.PI) / n
  const point = (i, radius) => {
    const a = angleStep * i - Math.PI / 2
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }
  }
  const polygon = (radius) => labels.map((_, i) => point(i, radius)).map(p => `${p.x},${p.y}`).join(' ')
  const dataPoints = labels.map((_, i) => {
    const v = values[i] || 0
    return point(i, Math.min(v / max, 1) * r)
  })
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <polygon key={pct} points={polygon(r * pct)} fill="none" stroke={GRIS_MEDIO} strokeWidth={0.8} />
      ))}
      {labels.map((_, i) => {
        const p = point(i, r)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={GRIS_MEDIO} strokeWidth={0.8} />
      })}
      <polygon points={dataPolygon} fill="rgba(198, 40, 40, 0.12)" stroke={ROJO_APT} strokeWidth={1.5} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={ROJO_APT} />
      ))}
      {labels.map((_, i) => {
        const p = point(i, r + 14)
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={5.5} fill="#6b7280" fontWeight={500}>
            {labels[i]}
          </text>
        )
      })}
    </svg>
  )
}

export default function PDF() {
  const { id: urlId } = useParams()
  const navigate = useNavigate()
  const [worker, setWorker] = useState(null)
  const [generando, setGenerando] = useState(false)
  const pdfRef = useRef(null)

  useEffect(() => {
    if (urlId) {
      (async () => { setWorker(await obtenerTrabajadorPorId(urlId)) })()
    }
  }, [urlId])

  const hasWorker = worker !== null
  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  const folioStr = useMemo(() => folio(), [])

  const getVal = (key) => {
    if (key === '__area__') return worker?.area
    if (key === '__empresa__') return worker?.empresa
    if (key === '__puesto__') return worker?.puesto
    if (key === '__fechaIngreso__') return worker?.fechaIngreso
    return worker?.datos_completos?.[key]
  }

  const aptitudes = worker?.aptitudes || {}
  const valsApt = APT_LABELS.map(n => Number(aptitudes[n]) || 0)
  const hasApt = valsApt.some(v => v > 0)
  const promApt = hasApt ? valsApt.reduce((a, b) => a + b, 0) / valsApt.length : 0
  const maxVal = hasApt ? Math.max(...valsApt) : 0
  const minVal = hasApt ? Math.min(...valsApt.filter(v => v > 0)) : 0
  const maxIdx = hasApt ? valsApt.indexOf(maxVal) : -1
  const minIdx = hasApt ? valsApt.indexOf(minVal) : -1
  const nivelGeneral = !hasApt ? null : promApt >= 8 ? 'ALTO' : promApt >= 6 ? 'Medio' : 'Bajo'

  const datosPersonales = DATOS_FIELDS.filter(f => hasValue(getVal(f.key)))
  const laborales = LABORAL_FIELDS.filter(f => hasValue(getVal(f.key)))

  const handleDownload = async () => {
    setGenerando(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const fileName = worker ? `resumen_${worker.nombre.replace(/\s+/g, '_')}.pdf` : 'resumen.pdf'
      const opt = {
        margin: [5, 5, 5, 5],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      }
      await html2pdf().set(opt).from(pdfRef.current).save()
    } catch (err) {
      console.error(err)
      alert('Error al generar el PDF.')
    }
    setGenerando(false)
  }

  return (
    <section className="exp-page">
        <div className="exp-header">
          <div className="exp-header-left">
            <h1 className="exp-title">Resumen del Trabajador</h1>
            <p className="exp-subtitle">Vista previa corporativa — descarga en PDF</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasWorker && worker && (
              <>
                <button type="button" className="exp-action-btn exp-action-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }} onClick={() => navigate('/editar/' + worker.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar Datos
                </button>
                <button type="button" className="exp-action-btn exp-action-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }} onClick={() => navigate('/editar/' + worker.id, { state: { tab: 1 } })}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Editar Aptitudes
                </button>
              </>
            )}
            <button type="button" className="exp-btn-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Regresar
            </button>
          </div>
        </div>

      {!hasWorker ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 15 }}>No hay trabajador seleccionado.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Selecciona un trabajador desde Expediente para generar su PDF.</p>
        </div>
      ) : (
        <div className="exp-content">
          <div ref={pdfRef} style={{ width: 820, margin: '0 auto', padding: 32, background: '#ffffff', fontFamily: "Arial, Helvetica, sans-serif", color: '#14213d' }}>

            {/* ═══ HEADER ═══ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${AZUL_CORP}`, paddingBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, background: AZUL_MARINO, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>RH</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: AZUL_MARINO }}>SISTEMA DE GESTIÓN</div>
                  <div style={{ fontSize: 10, color: '#5b6b88' }}>DE RECURSOS HUMANOS</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#3d4d66', lineHeight: 1.8, textAlign: 'right' }}>
                <div><strong>Fecha de emisión:</strong> {hoy}</div>
                <div><strong>Folio:</strong> {folioStr}</div>
              </div>
            </div>

            {/* ═══ PERFIL ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, padding: '28px 0', borderBottom: '1px solid #edf0f6' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: GRIS_MEDIO, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {worker.foto ? (
                    <img src={worker.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={AZUL_MARINO} strokeWidth="1.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: AZUL_MARINO, margin: 0 }}>{worker.nombre}</div>
                  <div style={{ fontSize: 13, color: AZUL_CORP, fontWeight: 600, marginTop: 6, marginBottom: 16 }}>{worker.puesto || ''}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {worker.empresa && <span style={{ fontSize: 11, color: '#5b6b88' }}><strong>Empresa:</strong> {worker.empresa}</span>}
                    {worker.area && <span style={{ fontSize: 11, color: '#5b6b88' }}><strong>Área:</strong> {worker.area}</span>}
                    {worker.estado && (
                      <span style={{ fontSize: 10, color: AZUL_CORP, background: GRIS_CLARO, border: `1px solid ${AZUL_CORP}`, padding: '2px 10px', borderRadius: 999, fontWeight: 700 }}>{worker.estado}</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #dfe5f0', paddingLeft: 28, fontSize: 11, color: '#3d4d66', lineHeight: 2.2 }}>
                {worker.fechaIngreso && <div><strong>Fecha de ingreso:</strong> {worker.fechaIngreso}</div>}
                {worker.id && <div><strong>ID Trabajador:</strong> TRB-{String(worker.id).padStart(3, '0')}</div>}
              </div>
            </div>

            {/* ═══ DATOS + LABORAL ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
              <div style={{ border: '1px solid #dfe5f0', borderRadius: 10, padding: '18px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: AZUL_MARINO, marginBottom: 16, textTransform: 'uppercase' }}>Datos Personales</div>
                {datosPersonales.length > 0 ? datosPersonales.map(f => (
                  <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 11, margin: '10px 0' }}>
                    <span style={{ color: '#5b6b88' }}>{f.label}</span>
                    <span style={{ fontWeight: 600, color: '#14213d', textAlign: 'right' }}>{getVal(f.key)}</span>
                  </div>
                )) : <span style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>Sin datos registrados</span>}
              </div>
              <div style={{ border: '1px solid #dfe5f0', borderRadius: 10, padding: '18px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: AZUL_MARINO, marginBottom: 16, textTransform: 'uppercase' }}>Información Laboral</div>
                {laborales.length > 0 ? laborales.map(f => (
                  <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 11, margin: '10px 0' }}>
                    <span style={{ color: '#5b6b88' }}>{f.label}</span>
                    <span style={{ fontWeight: 600, color: '#14213d', textAlign: 'right' }}>{getVal(f.key)}</span>
                  </div>
                )) : <span style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>Sin datos registrados</span>}
              </div>
            </div>

            {/* ═══ APTITUDES ═══ */}
            {hasApt && (
              <div style={{ border: '1px solid #dfe5f0', borderRadius: 10, padding: '18px 22px', marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: ROJO_APT, marginBottom: 16, textTransform: 'uppercase' }}>Aptitudes (Resumen)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.9fr', gap: 22, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <RadarChart values={valsApt} labels={APT_LABELS} size={200} max={10} />
                  </div>
                  <div>
                    {APT_LABELS.map((label, i) => {
                      const v = valsApt[i] || 0
                      const pct = Math.min((v / 10) * 100, 100)
                      return (
                        <div key={label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 30px', alignItems: 'center', gap: 8, marginBottom: 9, fontSize: 11 }}>
                          <span style={{ color: '#1f3763' }}>{label}</span>
                          <div style={{ width: '100%', height: 7, background: '#e3e8f1', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: ROJO_APT, borderRadius: 10 }} />
                          </div>
                          <b style={{ color: ROJO_APT }}>{v.toFixed(1)}</b>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ borderLeft: '1px solid #dfe5f0', paddingLeft: 20 }}>
                    <div style={{ border: '1px solid #dfe5f0', borderRadius: 6, padding: 12, marginBottom: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#6b7890', marginBottom: 4 }}>PROMEDIO GENERAL</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: ROJO_APT }}>{promApt.toFixed(1)}</div>
                    </div>
                    <div style={{ border: '1px solid #dfe5f0', borderRadius: 6, padding: 12, marginBottom: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#6b7890', marginBottom: 4 }}>NIVEL GENERAL</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: ROJO_APT }}>{nivelGeneral}</div>
                    </div>
                    <div style={{ border: '1px solid #dfe5f0', borderRadius: 6, padding: 12, marginBottom: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#6b7890', marginBottom: 4 }}>APTITUD MÁS ALTA</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ROJO_APT }}>{APT_LABELS[maxIdx]} ({maxVal.toFixed(1)})</div>
                    </div>
                    <div style={{ border: '1px solid #dfe5f0', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#6b7890', marginBottom: 4 }}>APTITUD MÁS BAJA</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ROJO_APT }}>{APT_LABELS[minIdx]} ({minVal.toFixed(1)})</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ OBSERVACIONES ═══ */}
            <div style={{ border: '1px solid #dfe5f0', borderRadius: 10, padding: '18px 22px', marginTop: 20, minHeight: 80 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: AZUL_MARINO, marginBottom: 10, textTransform: 'uppercase' }}>Observaciones</div>
              <div style={{ fontSize: 11, color: '#5b6b88', lineHeight: 1.5 }}>
                {worker.datos_completos?.['Observaciones'] && worker.datos_completos['Observaciones'] !== 'No registradas' ? worker.datos_completos['Observaciones'] : 'Sin observaciones registradas.'}
              </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid #cbd5e1', textAlign: 'center', fontSize: 10, color: '#6b7890' }}>
              Documento confidencial - Sistema de Gestión de Recursos Humanos · {folioStr}
            </div>
          </div>

          {/* Download Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              className="exp-action-btn exp-action-primary"
              onClick={handleDownload}
              disabled={generando}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px' }}
            >
              <Download size={18} />
              {generando ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
