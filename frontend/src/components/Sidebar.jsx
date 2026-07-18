import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Users, UserPlus, FolderOpen, FileText, Sun, Moon, LogOut, User, Lock, X, BrainCircuit, PanelLeftClose, PanelLeftOpen, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { cambiarPassword } from '../db/api.js'
import './Sidebar.css'

export default function Sidebar() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [tema, setTema] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark')
  const [showModal, setShowModal] = useState(false)
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [cargando, setCargando] = useState(false)
  const [colapsado, setColapsado] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('vdt_theme', tema)
  }, [tema])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e) => {
      setIsMobile(e.matches)
      if (e.matches) setColapsado(true)
    }
    setIsMobile(mq.matches)
    if (mq.matches) setColapsado(true)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleSidebar = () => setColapsado(c => !c)
  const handleNavClick = () => { if (isMobile) setColapsado(true) }

  const toggleTema = () => setTema(t => t === 'dark' ? 'light' : 'dark')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCambiarPassword = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')
    if (passNueva.length < 12) {
      setError('La nueva contraseña debe tener al menos 12 caracteres.')
      return
    }
    setCargando(true)
    try {
      await cambiarPassword(passActual, passNueva)
      setExito('Contraseña actualizada.')
      setPassActual('')
      setPassNueva('')
      setTimeout(() => setShowModal(false), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <aside className={`sidebar${colapsado ? ' colapsado' : ''}`}>
        <div className="sidebar-header">
          {!colapsado && (
            <div className="brand">
              <img src="/assets/logo-vdt.png" alt="VDT" className="sidebar-logo-img" />
              <span className="sidebar-company-name">Viviendas y Desarrollo de Teziutlan de S.A de C.V.</span>
            </div>
          )}
          <button type="button" className="sidebar-toggle-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {colapsado ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
        {!colapsado && (
          <>
            <nav>
              <NavLink to="/" end className={({ isActive }) => 'nav ' + (isActive ? 'active' : '')} onClick={handleNavClick}>
                <Home size={20} />Inicio
              </NavLink>
              <NavLink to="/trabajadores" className={({ isActive }) => 'nav ' + (isActive ? 'active' : '')} onClick={handleNavClick}>
                <Users size={20} />Trabajadores
              </NavLink>
              <NavLink to="/registro" className={({ isActive }) => 'nav ' + (isActive ? 'active' : '')} onClick={handleNavClick}>
                <UserPlus size={20} />Registro
              </NavLink>
              <NavLink to="/trabajadores?pendiente=evaluacion" className={({ isActive }) => 'nav nav-secondary ' + (isActive ? 'active' : '')} onClick={handleNavClick}>
                <BrainCircuit size={18} />Registrar Aptitudes
              </NavLink>
              <NavLink to="/expediente" className={({ isActive }) => 'nav ' + (isActive ? 'active' : '')} onClick={handleNavClick}>
                <FolderOpen size={20} />Expediente
              </NavLink>
            </nav>
            <div className="sidebar-section-label">Administración</div>
            <nav>
              <NavLink to="/admin/empresas" className={({ isActive }) => 'nav ' + (isActive ? 'active' : '')} onClick={handleNavClick}>
                <Building2 size={20} />Empresas
              </NavLink>
              <NavLink to="/admin/campos" className={({ isActive }) => 'nav ' + (isActive ? 'active' : '')} onClick={handleNavClick}>
                <FileText size={20} />Campos
              </NavLink>
            </nav>
            {usuario && (
              <div className="sidebar-user">
                <div className="sidebar-user-info">
                  <User size={16} />
                  <span className="sidebar-user-name">{usuario.nombre}</span>
                </div>
                <span className="sidebar-user-email">{usuario.email}</span>
              </div>
            )}
            <button type="button" className="sidebar-btn" onClick={() => { setError(''); setExito(''); setShowModal(true) }}>
              <Lock size={16} /> Cambiar Contraseña
            </button>
            <button type="button" className="theme-toggle" onClick={toggleTema}>
              {tema === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {tema === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
            <button type="button" className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </>
        )}
      </aside>
      {colapsado && !isMobile && (
        <button type="button" className="sidebar-toggle-flotante" onClick={toggleSidebar} aria-label="Abrir sidebar">
          <PanelLeftOpen size={22} />
        </button>
      )}
      {!colapsado && isMobile && (
        <div className="sidebar-backdrop" onClick={() => setColapsado(true)} />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <Lock size={20} />
              <h3>Cambiar Contraseña</h3>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCambiarPassword}>
              {error && <div className="modal-error">{error}</div>}
              {exito && <div className="modal-exito">{exito}</div>}
              <label className="modal-label">
                Contraseña actual
                <input type="password" value={passActual} onChange={e => setPassActual(e.target.value)} required />
              </label>
              <label className="modal-label">
                Nueva contraseña (mín. 12 caracteres)
                <input type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)} required />
              </label>
              <button type="submit" className="modal-btn" disabled={cargando}>
                {cargando ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
