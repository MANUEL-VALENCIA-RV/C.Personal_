import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../db/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Eye, EyeOff, ShieldAlert, User, Lock, LogIn, Chrome } from 'lucide-react'
import './Login.css'

const API = import.meta.env.VITE_API_URL || '/api'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verificar } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [verPass, setVerPass] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    const googleError = searchParams.get('error')
    const nombre = searchParams.get('nombre')

    if (googleError) {
      setError(googleError)
      return
    }

    if (token) {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_usuario', JSON.stringify({
        nombre,
        email: searchParams.get('email'),
        rol: searchParams.get('rol'),
      }))
      navigate('/')
    }
  }, [searchParams, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    if (!email || !password) {
      setError('Todos los campos son requeridos.')
      setCargando(false)
      return
    }

    try {
      await login(email, password)
      await verificar()
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    try {
      const res = await fetch(`${API}/auth/google`)
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('No se pudo iniciar sesión con Google')
      }
    } catch {
      setError('Error al conectar con Google')
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">
            <ShieldAlert size={32} />
          </div>
          <h1>Control Personal</h1>
          <p>Sistema de Gestión de Recursos Humanos</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          {error && <div className="login-error"><ShieldAlert size={16} />{error}</div>}

          <div className="login-field">
            <label htmlFor="email">
              <User size={16} />
              <span>Usuario</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={cargando}
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">
              <Lock size={16} />
              <span>Contraseña</span>
            </label>
            <div className="login-password-wrap">
              <input
                id="password"
                type={verPass ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={cargando}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-toggle-pass"
                onClick={() => setVerPass(!verPass)}
                tabIndex={-1}
              >
                {verPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={cargando}>
            <LogIn size={18} />
            {cargando ? 'Verificando...' : 'Ingresar'}
          </button>

          <div className="login-divider">
            <span>o</span>
          </div>

          <button type="button" className="login-btn-google" onClick={handleGoogleLogin} disabled={cargando}>
            <Chrome size={18} />
            Continuar con Google
          </button>
        </form>

        <div className="login-footer">
          <span>Sistema RH v1.0</span>
          <span className="login-dot">·</span>
          <span>Acceso restringido</span>
        </div>
      </div>
    </div>
  )
}
