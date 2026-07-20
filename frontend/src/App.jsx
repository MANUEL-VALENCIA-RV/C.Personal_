import { lazy, Suspense, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'
import PageEditor, { EditarBtn } from './components/PageEditor.jsx'
import { detectarPagina } from './components/pageEditorConfig.js'

import Inicio from './pages/Inicio.jsx'
import Login from './pages/Login.jsx'
import CalendarioGeneral from "./pages/calencarioGeneral.jsx";
const Trabajadores = lazy(() => import('./pages/Trabajadores.jsx'))
const Registro = lazy(() => import('./pages/Registro.jsx'))
const EditarPersonal = lazy(() => import('./pages/EditarPersonal.jsx'))
const Expediente = lazy(() => import('./pages/Expediente.jsx'))
const PDF = lazy(() => import('./pages/PDF.jsx'))
const AdminEmpresas = lazy(() => import('./pages/AdminEmpresas.jsx'))
const AdminCampos = lazy(() => import('./pages/AdminCampos.jsx'))

function SuspenseFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-muted)',
      fontSize: 14
    }}>
      Cargando...
    </div>
  )
}

function AppLayout() {
  const location = useLocation()
  const [showEditor, setShowEditor] = useState(false)
  const config = detectarPagina(location.pathname)

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/trabajadores" element={<Trabajadores />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/editar/:id" element={<EditarPersonal />} />
              <Route path="/expediente" element={<Expediente />} />
              <Route path="/expediente/:id" element={<Expediente />} />

              <Route
                  path="/calendario"
                  element={<CalendarioGeneral />}
              />
              <Route path="/calendario/:id" element={<CalendarioGeneral />} />
              <Route path="/pdf" element={<PDF />} />
              <Route path="/pdf/:id" element={<PDF />} />
              <Route path="/configuracion" element={<PDF />} />
              <Route path="/configuracion/:id" element={<PDF />} />
              <Route path="/admin/empresas" element={<AdminEmpresas />} />
              <Route path="/admin/campos" element={<AdminCampos />} />

              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {config && (
        <>
          <EditarBtn onClick={() => setShowEditor(true)} />
          {showEditor && (
            <PageEditor
              pageKey={config.pageKey}
              fields={config.fields || []}
              lists={config.lists || []}
              onClose={() => {
                setShowEditor(false)
                window.location.reload()
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

export default function App() {
  const { cargando } = useAuth()

  if (cargando) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-muted)',
        fontSize: 14
      }}>
        Verificando sesión...
      </div>
    )
  }

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        } />
      </Routes>
    </Suspense>
  )
}
