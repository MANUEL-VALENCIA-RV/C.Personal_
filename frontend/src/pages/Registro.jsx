import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { agregarTrabajador } from '../db/api.js'
import { useEmpresas } from '../hooks/useEmpresas.js'
import { useCamposAgrupados, GrupoCamposDinamico } from '../components/FormularioDinamico.jsx'
import { User } from 'lucide-react'
import './Registro.css'

const seccionesMap = {
  datos_personales: 'Datos Personales',
  contacto: 'Información de Contacto',
  laboral: 'Información Laboral',
  emergencia: 'Contacto de Emergencia',
  uniformes: 'Equipo y Uniformes',
}

export default function Registro() {
  const navigate = useNavigate()
  const { data: empresasList = [] } = useEmpresas()
  const { secciones } = useCamposAgrupados()
  const seccionesTitulos = useMemo(() => secciones.map(s => seccionesMap[s] || s), [secciones])
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState({})
  const [foto, setFoto] = useState('')
  const [arrastrando, setArrastrando] = useState(false)
  const [intentoGuardar, setIntentoGuardar] = useState(false)
  const [trabajadorCreado, setTrabajadorCreado] = useState(null)

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

  const guardarTrabajador = async (e) => {
    if(e) e.preventDefault()
    setIntentoGuardar(true)

    if(!datos['Nombre(s)'] || !datos['Apellido paterno']) {
        return;
    }

    const empresaSel = empresasList.find(e => e.dbValue === datos['Empresa'])
    const nuevoTrabajador = {
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
      datos_completos: datos
    }

    const result = await agregarTrabajador(nuevoTrabajador)
    setTrabajadorCreado(result)
  }

  return (
    <section className="page-registro">
      {trabajadorCreado ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#22c55e' }}>✓</div>
          <h2 style={{ marginBottom: 8 }}>Trabajador dado de alta</h2>
          <p className="muted" style={{ marginBottom: 32 }}>
            {trabajadorCreado.nombre} fue registrado exitosamente.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-sec"
              onClick={() => navigate('/trabajadores')}
            >
              Ir a lista
            </button>
            <button
              type="button"
              className="btn-pri"
              style={{ background: '#22c55e', borderColor: '#22c55e' }}
              onClick={() => navigate(`/expediente/${trabajadorCreado.id}`)}
            >
              Expediente
            </button>
          </div>
        </div>
      ) : (
        <>
      <div className="identidad-header card">
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
          <span className="label-ficha">Nuevo Trabajador</span>
          <div className="header-campos-nombre">
            <label className="header-label">
              <span>Nombre(s) <span className="campo-requerido">*</span></span>
              <input
                className={`header-input${intentoGuardar && !datos['Nombre(s)'] ? ' input-error' : ''}`}
                type="text" placeholder="Nombre(s)"
                value={datos['Nombre(s)'] || ''}
                onChange={e => setDatos({...datos, 'Nombre(s)': e.target.value})}
              />
              {intentoGuardar && !datos['Nombre(s)'] && <span className="campo-error-msg">Campo requerido</span>}
            </label>
            <label className="header-label">
              <span>Apellido paterno <span className="campo-requerido">*</span></span>
              <input
                className={`header-input${intentoGuardar && !datos['Apellido paterno'] ? ' input-error' : ''}`}
                type="text" placeholder="Apellido paterno"
                value={datos['Apellido paterno'] || ''}
                onChange={e => setDatos({...datos, 'Apellido paterno': e.target.value})}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
          <button
            type="button"
            className="btn-save-header"
            onClick={guardarTrabajador}
            style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
          >
            Guardar
          </button>
        </div>
      </div>

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
                ) : (
                    <button type="button" className="btn-pri" style={{marginLeft: paso === 0 ? 'auto' : ''}} onClick={guardarTrabajador}>
                        Guardar Trabajador
                    </button>
                )}
            </div>
        </form>
      </div>
      </>
      )}
    </section>
  )
}
