import { useQuery } from '@tanstack/react-query'
import { API, getToken, handleResponse } from '../db/api.js'

async function obtenerCampos() {
  const res = await fetch(`${API}/campos`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
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
