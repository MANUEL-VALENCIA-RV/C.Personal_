import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { verificarSesion, cerrarSesion, obtenerUsuarioActual } from '../db/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(obtenerUsuarioActual())
  const [cargando, setCargando] = useState(true)

  const verificar = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setUsuario(null)
      setCargando(false)
      return
    }
    try {
      const u = await verificarSesion()
      setUsuario(u)
      localStorage.setItem('auth_usuario', JSON.stringify(u))
    } catch {
      cerrarSesion()
      setUsuario(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { verificar() }, [verificar])

  const logout = useCallback(() => {
    cerrarSesion()
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, cargando, verificar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
