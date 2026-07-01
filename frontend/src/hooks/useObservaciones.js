import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  obtenerObservacionesTrabajador,
  crearObservacionTrabajador,
  actualizarObservacionTrabajador,
  eliminarObservacionTrabajador,
} from '../db/api.js'

export function useObservaciones(trabajadorId) {
  return useQuery({
    queryKey: ['observaciones', trabajadorId],
    queryFn: () => obtenerObservacionesTrabajador(trabajadorId),
    enabled: !!trabajadorId,
    staleTime: 0,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })
}

export function useCrearObservacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ trabajadorId, data }) => crearObservacionTrabajador(trabajadorId, data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['observaciones', vars.trabajadorId] }),
  })
}

export function useActualizarObservacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ trabajadorId, observacionId, data }) => actualizarObservacionTrabajador(trabajadorId, observacionId, data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['observaciones', vars.trabajadorId] }),
  })
}

export function useEliminarObservacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ trabajadorId, observacionId }) => eliminarObservacionTrabajador(trabajadorId, observacionId),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['observaciones', vars.trabajadorId] }),
  })
}
