import { useQuery } from '@tanstack/react-query'
import { API, getToken, handleResponse } from '../db/api.js'

async function obtenerEmpresas() {
  const res = await fetch(`${API}/empresas`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  const data = await handleResponse(res)
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
