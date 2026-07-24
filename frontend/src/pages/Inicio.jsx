import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Users, Building2, UserPlus, BrainCircuit, FileText,
    FolderOpen, ArrowRight, ChevronRight, Calendar,
    Search, Clock, AlertTriangle
} from 'lucide-react'
import { useTrabajadoresList } from '../hooks/useTrabajadores.js'
import { useEmpresas } from '../hooks/useEmpresas.js'
import { documentacionCampos } from '../components/DocumentoDropzone.jsx'
import { usePageLabels } from '../components/PageEditor.jsx'
import './Inicio.css'

function Sparkline({ data = [], color = '#3b82f6', height = 32 }) {
    const w = 80
    const max = Math.max(...data, 1)
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1 || 1)) * w
        const y = height - (v / max) * height
        return `${x},${y}`
    }).join(' ')

    return (
        <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{ flexShrink: 0 }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function KPICard({ icon, count, label, trend, color, bgColor }) {
    return (
        <div className="kpi-card" style={{ '--kpi-accent': color, '--kpi-bg': bgColor }}>
            <div className="kpi-top">
                <div className="kpi-icon-wrap" style={{ background: bgColor, color }}>
                    {icon}
                </div>
                <Sparkline data={trend} color={color} />
            </div>
            <div className="kpi-value">{count}</div>
            <div className="kpi-label">{label}</div>
        </div>
    )
}

function RecentRow({ t }) {
    const foto = t.foto
    const iniciales = (t.nombre || '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

    return (
        <div className="recent-row">
            <div className="recent-avatar">
                {foto ? <img src={foto} alt="" /> : <span>{iniciales}</span>}
            </div>
            <div className="recent-info">
                <div className="recent-name">{t.nombre}</div>
                <div className="recent-meta">{t.puesto}</div>
            </div>
            <div className="recent-area">{t.area || '—'}</div>
            <div className="recent-status">
                <span className={`status-dot ${(t.estado || 'Activo').toLowerCase()}`} />
                {t.estado || 'Activo'}
            </div>
            <div className="recent-date">{t.fechaIngreso || '—'}</div>
        </div>
    )
}

function QuickCard({ icon, title, desc, onClick, accent }) {
    return (
        <button type="button" className="quick-card" onClick={onClick} style={{ '--quick-accent': accent }}>
            <div className="quick-icon" style={{ background: `${accent}15`, color: accent }}>{icon}</div>
            <div className="quick-body">
                <div className="quick-title">{title}</div>
                <div className="quick-desc">{desc}</div>
            </div>
            <div className="quick-arrow" style={{ color: accent }}><ChevronRight size={18} /></div>
        </button>
    )
}

function AlertCard({ icon, count, label, desc, color, onClick }) {
    if (count === 0) return null

    return (
        <button type="button" className="alert-card" onClick={onClick} style={{ '--alert-accent': color }}>
            <div className="alert-icon" style={{ background: `${color}15`, color }}>{icon}</div>
            <div className="alert-body">
                <div className="alert-count">{count}</div>
                <div className="alert-label">{label}</div>
                <div className="alert-desc">{desc}</div>
            </div>
            <ChevronRight size={18} className="alert-arrow" style={{ color }} />
        </button>
    )
}

export default function Inicio() {
    const navigate = useNavigate()
    const params = useMemo(() => ({ limit: 200 }), [])
    const { data, isLoading } = useTrabajadoresList(params)
    const { data: empresas = [] } = useEmpresas()

    const labels = usePageLabels('inicio', {})
    const trabajadores = data?.data || []
    const total = data?.total ?? trabajadores.length

    const sinEvaluacion = trabajadores.filter(t => !t.resultado_psicometrico?.ci_obtenido)
    const docsIncompletos = trabajadores.filter(t => {
        const subidos = t.documentosSubidos || []
        return subidos.length < documentacionCampos.length
    })
    const inactivos = trabajadores.filter(t => t.estado !== 'Activo')

    const recientes = useMemo(() =>
            [...trabajadores].reverse().slice(0, 5),
        [trabajadores]
    )

    const hoy = new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const trendUp = [2, 4, 3, 5, 4, 6, 5, 7, 6, 8]

    const hora = new Date().getHours()
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

    const L = (key, fallback) => labels[key] || fallback

    return (
        <section className="inicio-page">
            <div className="inicio-header">
                <div className="inicio-header-left">
                    <div className="inicio-greeting">{saludo}, Administrador</div>
                    <h1 className="inicio-title">{L('titulo', 'Centro de Control de Personal')}</h1>
                    <div className="inicio-subtitle">{L('subtitulo', 'Resumen general del sistema de Recursos Humanos')}</div>
                </div>

                <div className="inicio-header-right">
                    <button
                        type="button"
                        className="inicio-date"
                        onClick={() => navigate('/calendario')}
                    >
                        <Calendar size={14} />
                        <span>{hoy}</span>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <p style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Cargando panel...</p>
            ) : (
                <>
                    <div className="inicio-kpi-grid">
                        <button onClick={() => navigate('/trabajadores')} className="kpi-button">
                            <KPICard
                                icon={<Users size={22} />}
                                count={total}
                                label="Total de trabajadores"
                                trend={trendUp}
                                color="#3b82f6"
                                bgColor="rgba(59,130,246,0.12)"
                            />
                        </button>

                        {empresas.map(emp => {
                            const count = trabajadores.filter(t => t.empresa === emp.dbValue).length
                            return (
                                <button key={emp.id || emp.dbValue} onClick={() => navigate(`/trabajadores?empresa=${emp.dbValue}`)} className="kpi-button">
                                    <KPICard
                                        icon={<Building2 size={22} />}
                                        count={count}
                                        label={emp.label}
                                        trend={trendUp.map(v => v * (0.3 + Math.random() * 0.4))}
                                        color={emp.color}
                                        bgColor={hexToRgba(emp.color, 0.12)}
                                    />
                                </button>
                            )
                        })}
                    </div>

                    {(sinEvaluacion.length > 0 || docsIncompletos.length > 0 || inactivos.length > 0) && (
                        <div className="inicio-section">
                            <div className="section-header">
                                <div className="section-title">
                                    <AlertTriangle size={18} />
                                    <span>{L('titulo_pendientes', 'Pendientes por atender')}</span>
                                </div>
                            </div>
                            <div className="alert-grid">
                                <AlertCard
                                    icon={<BrainCircuit size={20} />}
                                    count={sinEvaluacion.length}
                                    label="Sin evaluación de aptitudes"
                                    desc="Trabajadores que aún no tienen evaluación psicométrica"
                                    color="#f59e0b"
                                    onClick={() => navigate('/trabajadores?pendiente=evaluacion')}
                                />
                                <AlertCard
                                    icon={<FileText size={20} />}
                                    count={docsIncompletos.length}
                                    label="Documentación incompleta"
                                    desc="Trabajadores que faltan por cargar documentos"
                                    color="#ef4444"
                                    onClick={() => navigate('/trabajadores?pendiente=documentos')}
                                />
                                <AlertCard
                                    icon={<Users size={20} />}
                                    count={inactivos.length}
                                    label="Trabajadores no activos"
                                    desc="Inactivos o suspendidos en el sistema"
                                    color="#8b5cf6"
                                    onClick={() => navigate('/trabajadores?estado=Inactivo')}
                                />
                            </div>
                        </div>
                    )}

                    {recientes.length > 0 && (
                        <div className="inicio-section">
                            <div className="section-header">
                                <div className="section-title">
                                    <Clock size={18} />
                                    <span>{L('titulo_recientes', 'Trabajadores recientes')}</span>
                                </div>
                                <button type="button" className="section-link" onClick={() => navigate('/trabajadores')}>
                                    Ver todos <ArrowRight size={14} />
                                </button>
                            </div>
                            <div className="recent-table">
                                <div className="recent-table-header">
                                    <span style={{ flex: '0 0 44px' }} />
                                    <span style={{ flex: 1 }}>Nombre</span>
                                    <span style={{ flex: '0 0 140px' }}>Área</span>
                                    <span style={{ flex: '0 0 100px' }}>Estatus</span>
                                    <span style={{ flex: '0 0 120px' }}>Registro</span>
                                </div>
                                {recientes.map(t => (
                                    <div
                                        key={t.id}
                                        className="recent-row-wrap"
                                        onClick={() => navigate(`/expediente/${t.id}`)}
                                    >
                                        <RecentRow t={t} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="inicio-section">
                        <div className="section-header">
                            <div className="section-title">
                                <Search size={18} />
                                <span>{L('titulo_accesos', 'Accesos rápidos')}</span>
                            </div>
                        </div>
                        <div className="quick-grid">
                            <QuickCard
                                icon={<UserPlus size={22} />}
                                title="Nuevo trabajador"
                                desc="Registrar un nuevo empleado en el sistema"
                                onClick={() => navigate('/registro')}
                                accent="#3b82f6"
                            />
                            <QuickCard
                                icon={<BrainCircuit size={22} />}
                                title="Nueva aptitud"
                                desc="Evaluar aptitudes de un trabajador"
                                onClick={() => navigate('/trabajadores')}
                                accent="#8b5cf6"
                            />
                            <QuickCard
                                icon={<FolderOpen size={22} />}
                                title="Expedientes"
                                desc="Consultar expedientes del personal"
                                onClick={() => navigate('/trabajadores')}
                                accent="#f59e0b"
                            />
                        </div>
                    </div>

                    <div className="inicio-footer">
                        <span>{L('footer', 'Sistema de Gestión de Recursos Humanos')}</span>
                        <span className="footer-dot">·</span>
                        <span>{new Date().getFullYear()}</span>
                    </div>
                </>
            )}
        </section>
    )
}
