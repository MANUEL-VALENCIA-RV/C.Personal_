import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../db/supabase'

export function useEventStream() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Trabajador' }, () => {
        queryClient.invalidateQueries({ queryKey: ['trabajadores'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Empresa' }, () => {
        queryClient.invalidateQueries({ queryKey: ['empresas'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'CampoFormulario' }, () => {
        queryClient.invalidateQueries({ queryKey: ['campos'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Observacion' }, (payload) => {
        const trabajadorId = payload.new?.trabajadorId || payload.old?.trabajadorId
        if (trabajadorId) {
          queryClient.invalidateQueries({ queryKey: ['trabajador', trabajadorId] })
          queryClient.invalidateQueries({ queryKey: ['observaciones', trabajadorId] })
        }
        queryClient.invalidateQueries({ queryKey: ['trabajadores'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'CursosTrabajador' }, (payload) => {
        const trabajadorId = payload.new?.trabajadorId || payload.old?.trabajadorId
        if (trabajadorId) {
          queryClient.invalidateQueries({ queryKey: ['trabajador', trabajadorId] })
          queryClient.invalidateQueries({ queryKey: ['cursos', trabajadorId] })
        }
        queryClient.invalidateQueries({ queryKey: ['trabajadores'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'EventoCalendario' }, (payload) => {
        const trabajadorId = payload.new?.trabajadorId || payload.old?.trabajadorId
        if (trabajadorId) {
          queryClient.invalidateQueries({ queryKey: ['trabajador', trabajadorId] })
        }
        queryClient.invalidateQueries({ queryKey: ['calendario'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'DocumentoRequerido' }, () => {
        queryClient.invalidateQueries({ queryKey: ['configuracion'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'AptitudConfig' }, () => {
        queryClient.invalidateQueries({ queryKey: ['configuracion'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'SeccionExpediente' }, () => {
        queryClient.invalidateQueries({ queryKey: ['configuracion'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
