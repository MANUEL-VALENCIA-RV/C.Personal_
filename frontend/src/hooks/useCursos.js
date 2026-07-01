import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  obtenerCursosTrabajador,
  crearCursoTrabajador,
  actualizarCursoTrabajador,
  eliminarCursoTrabajador,
} from '../db/api.js'

export function useCursos(trabajadorId) {
  return useQuery({
    queryKey: ['cursos', trabajadorId],
    queryFn: () => obtenerCursosTrabajador(trabajadorId),
    enabled: !!trabajadorId,
    staleTime: 0,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })
}

export function useCrearCurso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ trabajadorId, data }) => crearCursoTrabajador(trabajadorId, data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['cursos', vars.trabajadorId] }),
  })
}

export function useActualizarCurso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ trabajadorId, cursoId, data }) => actualizarCursoTrabajador(trabajadorId, cursoId, data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['cursos', vars.trabajadorId] }),
  })
}

export function useEliminarCurso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ trabajadorId, cursoId }) => eliminarCursoTrabajador(trabajadorId, cursoId),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['cursos', vars.trabajadorId] }),
  })
}
