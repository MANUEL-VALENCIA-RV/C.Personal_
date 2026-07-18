import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { actualizarTrabajador, obtenerTrabajadorPorId, calcularTerman, obtenerDocumentos } from '../db/api.js'
import { useEmpresas } from '../hooks/useEmpresas.js'
import { useCamposAgrupados, GrupoCamposDinamico } from '../components/FormularioDinamico.jsx'
import DocumentoDropzone, { documentacionCampos } from '../components/DocumentoDropzone.jsx'
import {
  BookOpen, Scale, Book, Combine, Target, Search, BrainCircuit,
  ClipboardList, Layout, Eye, BarChart3, TrendingUp, TrendingDown,
  Calendar, User, StickyNote, FileText
} from 'lucide-react'
import './Registro.css'
import './RegistroAptitudes.css'

const tabs = ['Datos', 'Aptitudes', 'Documentación']

const seccionesMap = {
  datos_personales: 'Datos Personales',
  contacto: 'Información de Contacto',
  laboral: 'Información Laboral',
  emergencia: 'Contacto de Emergencia',
  uniformes: 'Equipo y Uniformes',
}

const APTITUDES = [
  { nombre: 'Información', icon: BookOpen },
  { nombre: 'Juicio', icon: Scale },
  { nombre: 'Vocabulario', icon: Book },
  { nombre: 'Síntesis', icon: Combine },
  { nombre: 'Concentración', icon: Target },
  { nombre: 'Análisis', icon: Search },
  { nombre: 'Abstracción', icon: BrainCircuit },
  { nombre: 'Planeación', icon: ClipboardList },
  { nombre: 'Organización', icon: Layout },
  { nombre: 'Atención', icon: Eye },
]

function AptitudSlider({ nombre, icon: Icon, value, onChange }) {
  const trackRef = useRef(null)

  const handleTrackClick = (e) => {
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onChange(Math.round(pct * 10 * 2) / 2)
  }

  const pct = (value / 10) * 100

  return (
    <div className="apt-slider-card">
      <div className="apt-slider-header">
        <div className="apt-slider-icon"><Icon size={18} /></div>
        <span className="apt-slider-name">{nombre}</span>
      </div>
      <div className="apt-slider-controls">
        <button className="apt-slider-btn" onClick={() => onChange(Math.max(0, Math.round((value - 0.5) * 10) / 10))} type="button">−</button>
        <div className="apt-slider-track-wrap" ref={trackRef} onClick={handleTrackClick}>
          <div className="apt-slider-track">
            <div className="apt-slider-fill" style={{ width: `${pct}%` }} />
            <div className="apt-slider-thumb" style={{ left: `${pct}%` }} />
            <input
              type="range" min={0} max={10} step={0.5}
              value={value}
              onChange={e => onChange(parseFloat(e.target.value))}
              className="apt-slider-range"
            />
          </div>
        </div>
        <span className="apt-slider-value">{value.toFixed(1)}</span>
        <button className="apt-slider-btn" onClick={() => onChange(Math.min(10, Math.round((value + 0.5) * 10) / 10))} type="button">+</button>
      </div>
    </div>
  )
}

export default function EditarPersonal() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const { data: empresasList = [] } = useEmpresas()
  const { secciones } = useCamposAgrupados()
  const seccionesTitulos = useMemo(() => secciones.map(s => seccionesMap[s] || s), [secciones])
  const [tab, setTab] = useState(location.state?.tab ?? 0)
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState({})
  const [foto, setFoto] = useState('')
  const [arrastrando, setArrastrando] = useState(false)
  const [docsDrive, setDocsDrive] = useState([])
  const [aptValores, setAptValores] = useState({})
  const [aptFecha, setAptFecha] = useState(new Date().toISOString().split('T')[0])
  const [aptEvaluador, setAptEvaluador] = useState('')
  const [aptObservaciones, setAptObservaciones] = useState('')
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [intentoGuardar, setIntentoGuardar] = useState(false)
  const [errorCarga, setErrorCarga] = useState(null)

  const manejarArchivo = (archivo) => {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setFoto(e.target.result);
    reader.readAsDataURL(archivo);
  }

  const manejarDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    const archivo = e.dataTransfer.files[0];
    manejarArchivo(archivo);
  }

  const manejarDragOver = (e) => { e.preventDefault(); setArrastrando(true); }
  const manejarDragLeave = () => { setArrastrando(false); }

  const cargarDocumentos = async () => {
    if (!selectedWorker?.id) return
    try {
      const res = await obtenerDocumentos(selectedWorker.id)
      setDocsDrive(res.documentos || [])
    } catch (err) {
      console.error('Error cargando documentos:', err)
    }
  }

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          setErrorCarga(null)
          const t = await obtenerTrabajadorPorId(id)
          if (t) {
            setSelectedWorker(t)
            const existing = t.aptitudes || {}
            const vals = {}
            APTITUDES.forEach(a => { vals[a.nombre] = Number(existing[a.nombre]) || 0 })
            setAptValores(vals)
            setDatos(t.datos_completos || {})
            if (t.foto) setFoto(t.foto)
          }
        } catch (err) {
          setErrorCarga(err.message)
        }
      })()
    }
  }, [id])

  useEffect(() => {
    if (selectedWorker?.id && tab === 2) {
      cargarDocumentos()
    }
  }, [selectedWorker?.id, tab])

  const onUploadComplete = (campo, doc) => {
    setDocsDrive(prev => {
      const existe = prev.findIndex(d => d.nombre === campo)
      if (existe >= 0) {
        const copia = [...prev]
        copia[existe] = doc
        return copia
      }
      return [...prev, doc]
    })
  }

  const guardarTrabajador = async (e) => {
    if(e) e.preventDefault()

    if (tab === 1) {
      if (!selectedWorker) return alert('Selecciona un trabajador primero.')
      const aptData = {}
      APTITUDES.forEach(a => { aptData[a.nombre] = aptValores[a.nombre] || 0 })
      const aptTerman = {}
      APTITUDES.forEach(a => { aptTerman[a.nombre] = (aptValores[a.nombre] || 0) * 10 })
      const resultado = Object.values(aptValores).some(v => v > 0)
        ? { ...calcularTerman(aptTerman), fecha_evaluacion: aptFecha, evaluador: aptEvaluador || 'Sistema', observaciones: aptObservaciones }
        : null
      await actualizarTrabajador(selectedWorker.id, { aptitudes: aptData, resultado_psicometrico: resultado })
      alert('Aptitudes guardadas exitosamente.')
      navigate('/expediente/' + selectedWorker.id)
      return
    }

    if(!datos['Nombre(s)'] || !datos['Apellido paterno']) {
        setIntentoGuardar(true)
        return;
    }

    const aptData = {}
    APTITUDES.forEach(a => { aptData[a.nombre] = aptValores[a.nombre] || 0 })
    const aptTerman = {}
    APTITUDES.forEach(a => { aptTerman[a.nombre] = (aptValores[a.nombre] || 0) * 10 })
    const resultado = Object.values(aptValores).some(v => v > 0)
      ? { ...calcularTerman(aptTerman), fecha_evaluacion: aptFecha, evaluador: aptEvaluador || 'Sistema', observaciones: aptObservaciones }
      : null

    const empresaSel = empresasList.find(e => e.dbValue === datos['Empresa'])
    const trabajadorActualizado = {
      nombre: `${datos['Nombre(s)'] || ''} ${datos['Apellido paterno'] || ''} ${datos['Apellido materno'] || ''}`.trim(),
      empresa: datos['Empresa'] || 'N/A',
      empresaId: empresaSel?.id || null,
      puesto: datos['Puesto'] || 'N/A',
      area: datos['Área'] || 'N/A',
      telefono: datos['Teléfono personal'] || 'N/A',
      correo: datos['Correo personal'] || 'N/A',
      fechaIngreso: datos['Fecha de ingreso'] || new Date().toISOString().split('T')[0],
      estado: 'Activo',
      foto: foto,
      aptitudes: aptData,
      resultado_psicometrico: resultado,
      datos_completos: datos
    }

    await actualizarTrabajador(selectedWorker.id, trabajadorActualizado)
    alert('Trabajador actualizado exitosamente.')
    navigate('/expediente/' + selectedWorker.id)
  }

  if (errorCarga) {
    return (
      <section className="page-registro">
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#ef4444' }}>!</div>
          <h2 style={{ marginBottom: 8 }}>Error al cargar trabajador</h2>
          <p className="muted" style={{ marginBottom: 32 }}>{errorCarga}</p>
          <button type="button" className="btn-sec" onClick={() => navigate('/trabajadores')}>
            Volver a lista
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="page-registro">
      {/* ENCABEZADO */}
      <div className="identidad-header card">
        {tab === 0 ? (
          <>
            <div 
              className={`foto-ficha ${arrastrando ? 'active' : ''} ${foto ? 'has-foto' : ''}`}
              onDragOver={manejarDragOver}
              onDragLeave={manejarDragLeave}
              onDrop={manejarDrop}
              onClick={() => document.getElementById('foto-input').click()}
            >
              {foto ? (
                <img src={foto} alt="Trabajador" />
              ) : (
                <User size={48} className="foto-icono" />
              )}
              <input id="foto-input" type="file" accept="image/*" style={{display:'none'}} onChange={(e)=>manejarArchivo(e.target.files[0])} />
              <span className="foto-badge">FOTO</span>
            </div>
            <div className="datos-principales">
              <span className="label-ficha">Editando: {selectedWorker?.nombre || 'Cargando...'}</span>
              <div className="header-campos-nombre">
                <label className="header-label">
                  <span>Nombre(s) <span className="campo-requerido">*</span></span>
                  <input
                    className={`header-input${intentoGuardar && !datos['Nombre(s)'] ? ' input-error' : ''}`}
                    type="text" placeholder="Nombre(s)"
                    value={datos['Nombre(s)'] || ''}
                    onChange={e => { setDatos({...datos, 'Nombre(s)': e.target.value}); setIntentoGuardar(false); }}
                  />
                  {intentoGuardar && !datos['Nombre(s)'] && <span className="campo-error-msg">Campo requerido</span>}
                </label>
                <label className="header-label">
                  <span>Apellido paterno <span className="campo-requerido">*</span></span>
                  <input
                    className={`header-input${intentoGuardar && !datos['Apellido paterno'] ? ' input-error' : ''}`}
                    type="text" placeholder="Apellido paterno"
                    value={datos['Apellido paterno'] || ''}
                    onChange={e => { setDatos({...datos, 'Apellido paterno': e.target.value}); setIntentoGuardar(false); }}
                  />
                  {intentoGuardar && !datos['Apellido paterno'] && <span className="campo-error-msg">Campo requerido</span>}
                </label>
                <label className="header-label">
                  <span>Apellido materno</span>
                  <input className="header-input" type="text" placeholder="Apellido materno" value={datos['Apellido materno'] || ''} onChange={e => setDatos({...datos, 'Apellido materno': e.target.value})} />
                </label>
              </div>
              <div className="header-campos-laboral">
                <label className="header-label">
                  <span>Empresa</span>
                  <select className="header-input" value={datos['Empresa'] || ''} onChange={e => setDatos({...datos, 'Empresa': e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {empresasList.map(e => (
                      <option key={e.dbValue} value={e.dbValue}>{e.label}</option>
                    ))}
                  </select>
                </label>
                <label className="header-label">
                  <span>Puesto</span>
                  <input className="header-input" type="text" placeholder="Puesto" value={datos['Puesto'] || ''} onChange={e => setDatos({...datos, 'Puesto': e.target.value})} />
                </label>
              </div>
            </div>
          </>
        ) : tab === 1 ? (
          <>
            <div className="foto-ficha" style={{ background: 'var(--primary-shadow)' }}>
              {selectedWorker?.foto ? (
                <img src={selectedWorker.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <BrainCircuit size={40} style={{ color: '#8b5cf6' }} />
              )}
            </div>
            <div className="datos-principales">
              <span className="label-ficha" style={{ color: '#8b5cf6' }}>Evaluación de Aptitudes</span>
              <div className="header-campos-nombre">
                <label className="header-label">
                  <span>Trabajador</span>
                  <input className="header-input" type="text" value={selectedWorker?.nombre || 'Cargando...'} readOnly style={{ opacity: 0.7 }} />
                </label>
                <label className="header-label">
                  <span>Empresa</span>
                  <input className="header-input" type="text" value={selectedWorker?.empresa || ''} readOnly style={{ opacity: 0.7 }} />
                </label>
                <label className="header-label">
                  <span>Puesto</span>
                  <input className="header-input" type="text" value={selectedWorker?.puesto || ''} readOnly style={{ opacity: 0.7 }} />
                </label>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="foto-ficha" style={{ background: 'var(--primary-shadow)' }}>
              {selectedWorker?.foto ? (
                <img src={selectedWorker.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <FileText size={40} style={{ color: '#22c55e' }} />
              )}
            </div>
            <div className="datos-principales">
              <span className="label-ficha" style={{ color: '#22c55e' }}>Documentación</span>
              <div className="header-campos-nombre">
                <label className="header-label">
                  <span>Trabajador</span>
                  <input className="header-input" type="text" value={selectedWorker?.nombre || 'Cargando...'} readOnly style={{ opacity: 0.7 }} />
                </label>
                <label className="header-label">
                  <span>Empresa</span>
                  <input className="header-input" type="text" value={selectedWorker?.empresa || ''} readOnly style={{ opacity: 0.7 }} />
                </label>
                <label className="header-label">
                  <span>Puesto</span>
                  <input className="header-input" type="text" value={selectedWorker?.puesto || ''} readOnly style={{ opacity: 0.7 }} />
                </label>
              </div>
            </div>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
          <button
            type="button"
            className="btn-save-header"
            onClick={guardarTrabajador}
            style={{
              background: tab === 0 ? '#3b82f6' : tab === 1 ? '#8b5cf6' : '#22c55e',
              borderColor: tab === 0 ? '#3b82f6' : tab === 1 ? '#8b5cf6' : '#22c55e',
            }}
          >
            Guardar
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {tabs.map((titulo, index) => (
          <button
            key={titulo}
            type="button"
            className={tab === index ? 'btn' : 'btn2'}
            onClick={() => setTab(index)}
          >
            {titulo}
          </button>
        ))}
      </div>

      {/* TAB DATOS */}
      {tab === 0 && (
        <>
          <div className="pasos-nav">
            {secciones.map((sec, i) => (
              <button
                key={sec}
                type="button"
                className={`paso-btn ${paso === i ? 'activo' : ''}`}
                onClick={() => setPaso(i)}
              >
                <span className="paso-num">{i + 1}</span>
                <span className="paso-txt">{seccionesMap[sec] || sec}</span>
              </button>
            ))}
          </div>

          <div className="card-registro">
            <div className="seccion-activa-header">
                <h2>{seccionesMap[secciones[paso]] || secciones[paso]}</h2>
                <p className="muted">Completa la información correspondiente a esta sección.</p>
            </div>
            
            <form className="form-registro-contenido" onSubmit={(e) => e.preventDefault()}>
                <GrupoCamposDinamico seccion={secciones[paso]} datos={datos} setDatos={setDatos} />

                <div className="footer-controles">
                    {paso > 0 && (
                        <button type="button" className="btn-sec" onClick={() => setPaso(paso - 1)}>
                            Sección Anterior
                        </button>
                    )}
                    {paso < secciones.length - 1 ? (
                        <button type="button" className="btn-pri" style={{marginLeft: paso === 0 ? 'auto' : ''}} onClick={() => setPaso(paso + 1)}>
                            Siguiente Sección
                        </button>
                    ) : null}
                </div>
            </form>
          </div>
        </>
      )}

      {/* TAB APTITUDES */}
      {tab === 1 && (
        <div className="card-registro">
          <div className="seccion-activa-header">
            <h2>Evaluación de Aptitudes</h2>
            <p className="muted">Asigna un valor del 0 al 10 a cada aptitud.</p>
          </div>

          <div className="apt-eval-row">
            <div className="apt-eval-card">
              <div className="apt-eval-icon"><Calendar size={18} /></div>
              <div className="apt-eval-fields">
                <label>Fecha de aplicación</label>
                <input type="date" value={aptFecha} onChange={e => setAptFecha(e.target.value)} />
              </div>
            </div>
            <div className="apt-eval-card">
              <div className="apt-eval-icon"><User size={18} /></div>
              <div className="apt-eval-fields">
                <label>Evaluador</label>
                <input type="text" placeholder="Nombre del evaluador" value={aptEvaluador} onChange={e => setAptEvaluador(e.target.value)} />
              </div>
            </div>
            <div className="apt-eval-card apt-eval-wide">
              <div className="apt-eval-icon"><StickyNote size={18} /></div>
              <div className="apt-eval-fields">
                <label>Observaciones generales</label>
                <input type="text" placeholder="Notas y observaciones de la evaluación" value={aptObservaciones} onChange={e => setAptObservaciones(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="apt-sliders-grid">
            {APTITUDES.map(a => (
              <AptitudSlider key={a.nombre} nombre={a.nombre} icon={a.icon} value={aptValores[a.nombre] || 0} onChange={v => setAptValores(prev => ({...prev, [a.nombre]: v}))} />
            ))}
          </div>

          {(() => {
            const vals = APTITUDES.map(a => aptValores[a.nombre] || 0)
            const hasData = vals.some(v => v > 0)
            const prom = hasData ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
            const max = hasData ? Math.max(...vals) : 0
            const min = hasData ? Math.min(...vals.filter(v => v > 0)) : 0
            const maxI = hasData ? vals.indexOf(max) : -1
            const minI = hasData ? vals.indexOf(min) : -1
            const nivel = !hasData ? '---' : prom >= 8 ? 'Alto' : prom >= 6 ? 'Medio' : 'Bajo'
            return (
              <div className="apt-kpi-grid">
                <div className="apt-kpi-card" style={{ '--kpi-accent': '#3b82f6' }}>
                  <div className="apt-kpi-icon"><BarChart3 size={20} /></div>
                  <div className="apt-kpi-body">
                    <span className="apt-kpi-value">{hasData ? prom.toFixed(1) : '---'}</span>
                    <span className="apt-kpi-label">Promedio General</span>
                  </div>
                </div>
                <div className="apt-kpi-card" style={{ '--kpi-accent': '#a78bfa' }}>
                  <div className="apt-kpi-icon"><Target size={20} /></div>
                  <div className="apt-kpi-body">
                    <span className="apt-kpi-value">{nivel}</span>
                    <span className="apt-kpi-label">Nivel General</span>
                  </div>
                </div>
                <div className="apt-kpi-card" style={{ '--kpi-accent': '#22c55e' }}>
                  <div className="apt-kpi-icon"><TrendingUp size={20} /></div>
                  <div className="apt-kpi-body">
                    <span className="apt-kpi-value">{hasData ? max.toFixed(1) : '---'}</span>
                    <span className="apt-kpi-label">{hasData && maxI >= 0 ? APTITUDES[maxI].nombre : 'Aptitud Más Alta'}</span>
                  </div>
                </div>
                <div className="apt-kpi-card" style={{ '--kpi-accent': '#ef4444' }}>
                  <div className="apt-kpi-icon"><TrendingDown size={20} /></div>
                  <div className="apt-kpi-body">
                    <span className="apt-kpi-value">{hasData ? min.toFixed(1) : '---'}</span>
                    <span className="apt-kpi-label">{hasData && minI >= 0 ? APTITUDES[minI].nombre : 'Aptitud Más Baja'}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* TAB DOCUMENTACIÓN */}
      {tab === 2 && (
        <div className="card-registro">
          <div className="header-seccion">
            <h2>Archivo Digital de Documentos</h2>
          </div>
          <p className="muted" style={{ marginBottom: '20px' }}>Arrastra los archivos directamente a cada sección. Se subirán automáticamente a Google Drive.</p>
          <div className="docs-upload-grid">
            {documentacionCampos.map((campo) => {
              const docExistente = docsDrive.find(d => d.nombre === campo)
              return (
                <DocumentoDropzone 
                  key={campo} 
                  campo={campo} 
                  trabajadorId={selectedWorker?.id}
                  doc={docExistente}
                  onUploadComplete={onUploadComplete}
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
