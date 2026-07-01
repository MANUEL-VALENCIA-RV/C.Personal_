import { useQuery } from '@tanstack/react-query'

const API = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('auth_token')
}

async function obtenerEmpresas() {
  const res = await fetch(`${API}/empresas`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  if (!res.ok) throw new Error('Error al cargar empresas')
  const data = await res.json()
  return data.map(e => ({
    id: e.id,
    label: e.nombre,
    dbValue: e.nombre,
    color: e.color,
    activa: e.activa,
  }))
}

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: obtenerEmpresas,
    staleTime: 0,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })
}
