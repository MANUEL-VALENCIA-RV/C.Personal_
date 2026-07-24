import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trash2, Search, ChevronLeft, ChevronRight, AlertTriangle, BrainCircuit, FileText as FileTextIcon, CheckCircle2, XCircle, File } from 'lucide-react';
import { useTrabajadoresList, useEliminarTrabajador } from '../hooks/useTrabajadores.js';
import { useEmpresas } from '../hooks/useEmpresas.js';
import { establecerTrabajadorActivo, actualizarTrabajador } from '../db/api.js';
import { documentacionCampos } from '../components/DocumentoDropzone.jsx';
import { usePageLabels } from '../components/PageEditor.jsx';
import './Trabajadores.css'

const estados = ['Todas', 'Activo', 'Inactivo', 'Suspendido']
const LIMIT = 20

function ModalEliminar({ nombre, onConfirmar, onCancelar }) {
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-icon"><AlertTriangle size={28} /></div>
        <h3 className="modal-titulo">Eliminar trabajador</h3>
        <p className="modal-desc">
          ¿Estás seguro de que deseas eliminar a <strong>{nombre}</strong>?<br />
          Esta acción no se puede deshacer.
        </p>
        <div className="modal-acciones">
          <button type="button" className="modal-btn-cancelar" onClick={onCancelar}>Cancelar</button>
          <button type="button" className="modal-btn-confirmar" onClick={onConfirmar}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  )
}

export default function Trabajadores(){
  const nav=useNavigate();
  const location=useLocation();
  const [q,setQ]=useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [empresa,setEmpresa]=useState('Todas');
  const [estado,setEstado]=useState('Todas');
  const [pendienteFiltro,setPendienteFiltro]=useState(null);
  const [page, setPage] = useState(1);
  const [modalEliminar, setModalEliminar] = useState(null);
  const { data: empresasData = [] } = useEmpresas()
  const labels = usePageLabels('trabajadores', {});

  const L = (key, fallback) => labels[key] || fallback
  const empresas = ['Todas', ...empresasData.map(e => e.dbValue)]

  const eliminarMutation = useEliminarTrabajador()

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const estadoParam = params.get('estado');
    const empresaParam = params.get('empresa');
    const pendienteParam = params.get('pendiente');
    if (estadoParam) setEstado(estadoParam);
    if (empresaParam) setEmpresa(empresaParam);
    if (pendienteParam) setPendienteFiltro(pendienteParam);
  }, [location.search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQ(q)
    }, 400)
    return () => clearTimeout(timeout)
  }, [q])

  const params = useMemo(() => {
    const p = { q: debouncedQ, limit: LIMIT }
    if (estado !== 'Todas') p.estado = estado
    if (page > 1) p.page = page
    return p
  }, [debouncedQ, estado, page])

  const { data, isLoading, refetch } = useTrabajadoresList(params)

  const trabajadores = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  const manejarKeyDown = (e) => {
    if (e.key === 'Enter') setDebouncedQ(q)
  }

  const manejarCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPages) return
    setPage(nuevaPagina)
  }

  const manejarVerExpediente = (id) => {
    establecerTrabajadorActivo(id);
    nav('/expediente/' + id);
  };

  const manejarEliminar = async (id, nombre) => {
    setModalEliminar({ id, nombre });
  };

  const confirmarEliminar = async () => {
    if (!modalEliminar) return;
    await eliminarMutation.mutateAsync(modalEliminar.id);
    await refetch();
    setModalEliminar(null);
  };

  const manejarCambiarEstado = async (id, nombre, estadoActual) => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo'
    const accion = nuevoEstado === 'Inactivo' ? 'dar de baja' : 'activar'
    if (!confirm(`¿Estás seguro de ${accion} a ${nombre}?`)) return
    await actualizarTrabajador(id, { estado: nuevoEstado })
    await refetch()
  }

  const obtenerIniciales = (nombre) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  const list = trabajadores.filter(t => {
    if (empresa !== 'Todas' && t.empresa !== empresa) return false;
    if (pendienteFiltro === 'evaluacion') return !t.resultado_psicometrico?.ci_obtenido;
    if (pendienteFiltro === 'documentos') {
      const subidos = t.documentosSubidos || [];
      return subidos.length < documentacionCampos.length;
    }
    return true;
  });

  return <section className="page">
    {modalEliminar && (
      <ModalEliminar
        nombre={modalEliminar.nombre}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setModalEliminar(null)}
      />
    )}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h1>{L('titulo', 'Trabajadores')}</h1>
        <p className="muted">{total > 0 ? `${total} registros` : L('subtitulo', 'Consulta y filtra el personal registrado')}</p>
      </div>
    </div>
    <div className="card">
      <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder={L('buscar_placeholder', 'Buscar por nombre, CURP o RFC')} value={q} onChange={x=>setQ(x.target.value)} onKeyDown={manejarKeyDown} style={{ paddingLeft: 36 }} />
        </div>
        <select value={estado} onChange={x=>setEstado(x.target.value)}>
          {estados.map(e => <option key={e}>{e}</option>)}
        </select>
        <select value={empresa} onChange={x=>setEmpresa(x.target.value)}>
          {empresas.map(e => <option key={e}>{e}</option>)}
        </select>
        <button type="button" className="btn" onClick={()=>nav('/registro')}>Registrar trabajador</button>
      </div>
    </div>
    <div className="card">
      {pendienteFiltro && (
        <div className="filtro-activo-banner">
          {pendienteFiltro === 'evaluacion' && <><BrainCircuit size={16} /> Mostrando trabajadores sin evaluación de aptitudes</>}
          {pendienteFiltro === 'documentos' && <><FileTextIcon size={16} /> Mostrando trabajadores con documentación incompleta</>}
          <button type="button" className="filtro-activo-limpiar" onClick={() => { setPendienteFiltro(null); nav('/trabajadores', { replace: true }); }}>Limpiar filtro</button>
        </div>
      )}
      {isLoading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Cargando trabajadores...</p>
      ) : list.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No se encontraron trabajadores con esos filtros.</p>
      ) : (
      <>
      <table className="table">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Empresa</th>
            <th>Puesto</th>
            <th>Estado</th>
            <th>Evaluación</th>
            <th>Documentos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {list.map(t=>{
            const tieneEvaluacion = t.resultado_psicometrico && t.resultado_psicometrico.ci_obtenido;
            const docsSubidos = t.documentosSubidos || [];
            const docsSubidosNombres = new Set(docsSubidos.map(d => d.nombre));
            const totalDocs = documentacionCampos.length;
            const documentosCargados = docsSubidos.length;

            return (
              <tr key={t.id}>
                <td>
                  <div className="avatar">
                    {t.foto ? (
                      <img src={t.foto} alt={t.nombre} />
                    ) : (
                      obtenerIniciales(t.nombre || 'Sin Nombre')
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{t.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CURP: {t.datos_completos?.CURP || '---'}</div>
                </td>
                <td><span className="badge">{t.empresa}</span></td>
                <td>{t.puesto}</td>
                <td>
                  <span className={`badge ${t.estado === 'Activo' ? 'badge-success' : t.estado === 'Suspendido' ? 'badge-warning' : 'badge-danger'}`}>
                    {t.estado || 'Activo'}
                  </span>
                </td>
                <td>
                  {tieneEvaluacion ? (
                    <span className="status-ok">Completada</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="status-bad">Pendiente</span>
                      {pendienteFiltro === 'evaluacion' && (
                        <button
                          type="button"
                          className="btn2"
                          style={{ fontSize: 12, padding: '2px 10px', background: '#8b5cf6', color: '#fff', border: 'none' }}
                          onClick={() => nav(`/editar/${t.id}`, { state: { tab: 1 } })}
                        >
                          Registrar
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <div className="docs-cell">
                    <span className={`docs-count ${documentosCargados >= totalDocs ? 'docs-count-ok' : documentosCargados > 0 ? 'docs-count-partial' : 'docs-count-none'}`}>
                      {documentosCargados}/{totalDocs}
                    </span>
                    <div className="docs-chips">
                      {documentacionCampos.map(doc => {
                        const cargado = docsSubidosNombres.has(doc);
                        return (
                          <span key={doc} className={`doc-chip ${cargado ? 'doc-chip-ok' : 'doc-chip-missing'}`} title={doc}>
                            {cargado ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            <span className="doc-chip-label">{doc}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn2" onClick={()=>manejarVerExpediente(t.id)}>Ver expediente</button>
                  <button
                    type="button"
                    className="btn2"
                    style={{ color: t.estado === 'Activo' ? 'var(--danger)' : '#22c55e', borderColor: t.estado === 'Activo' ? 'var(--danger)' : '#22c55e' }}
                    onClick={() => manejarCambiarEstado(t.id, t.nombre, t.estado)}
                    title={t.estado === 'Activo' ? 'Dar de baja' : 'Activar'}
                  >
                    {t.estado === 'Activo' ? 'Dar de baja' : 'Activar'}
                  </button>
                  <button
                    type="button"
                    className="btn2"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => manejarEliminar(t.id, t.nombre)}
                    title="Eliminar trabajador"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn2 pag-btn" disabled={page <= 1} onClick={() => manejarCambiarPagina(page - 1)}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} type="button" className={`btn2 pag-btn ${p === page ? 'pag-active' : ''}`} onClick={() => manejarCambiarPagina(p)}>
              {p}
            </button>
          ))}
          <button type="button" className="btn2 pag-btn" disabled={page >= totalPages} onClick={() => manejarCambiarPagina(page + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      </>
      )}
    </div>
  </section>
}
