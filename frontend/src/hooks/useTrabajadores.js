import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  obtenerTrabajadores,
  obtenerTrabajadorPorId,
  agregarTrabajador,
  actualizarTrabajador,
  eliminarTrabajador,
} from '../db/api.js'

export function useTrabajadoresList(params = {}) {
  return useQuery({
    queryKey: ['trabajadores', params],
    queryFn: () => obtenerTrabajadores(params),
    staleTime: 0,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })
}

export function useTrabajador(id) {
  return useQuery({
    queryKey: ['trabajador', id],
    queryFn: () => obtenerTrabajadorPorId(id),
    enabled: !!id,
  })
}

export function useCrearTrabajador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: agregarTrabajador,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trabajadores'] }),
  })
}

export function useActualizarTrabajador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => actualizarTrabajador(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajadores'] })
      qc.invalidateQueries({ queryKey: ['trabajador'] })
    },
  })
}

export function useEliminarTrabajador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eliminarTrabajador,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trabajadores'] }),
  })
}
