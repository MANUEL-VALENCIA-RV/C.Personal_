import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  obtenerEventosCalendario,
  crearEventoCalendario,
  eliminarEventoCalendario,
} from '../db/api.js'

export function useEventosCalendario(params = {}) {
  return useQuery({
    queryKey: ['calendario', params],
    queryFn: () => obtenerEventosCalendario(params),
    staleTime: 0,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })
}

export function useCrearEventoCalendario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: crearEventoCalendario,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendario'] }),
  })
}

export function useEliminarEventoCalendario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eliminarEventoCalendario,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendario'] }),
  })
}
