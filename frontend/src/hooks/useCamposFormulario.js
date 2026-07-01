import { useQuery } from '@tanstack/react-query'

const API = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('auth_token')
}

async function obtenerCampos() {
  const res = await fetch(`${API}/campos`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  if (!res.ok) throw new Error('Error al cargar campos')
  return res.json()
}

export function useCamposFormulario() {
  return useQuery({
    queryKey: ['campos'],
    queryFn: obtenerCampos,
    staleTime: 0,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })
}
