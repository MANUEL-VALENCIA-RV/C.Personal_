import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const API = import.meta.env.VITE_API_URL || '/api'

export function useEventStream() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    const url = `${API}/events?token=${encodeURIComponent(token)}`
    const source = new EventSource(url)

    source.addEventListener('trabajador:created', () => {
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] })
    })

    source.addEventListener('trabajador:updated', (e) => {
      const data = JSON.parse(e.data)
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] })
      if (data.id) queryClient.invalidateQueries({ queryKey: ['trabajador', data.id] })
    })

    source.addEventListener('trabajador:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] })
    })

    source.addEventListener('empresa:created', () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
    })

    source.addEventListener('empresa:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
    })

    source.addEventListener('empresa:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
    })

    source.addEventListener('campo:created', () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] })
    })
    source.addEventListener('campo:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] })
    })
    source.addEventListener('campo:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] })
    })



    const refrescarDetalleTrabajador = (e) => {
      const data = JSON.parse(e.data || '{}')
      if (data.trabajadorId) {
        queryClient.invalidateQueries({ queryKey: ['trabajador', data.trabajadorId] })
        queryClient.invalidateQueries({ queryKey: ['observaciones', data.trabajadorId] })
        queryClient.invalidateQueries({ queryKey: ['cursos', data.trabajadorId] })
      }
      queryClient.invalidateQueries({ queryKey: ['calendario'] })
    }

    source.addEventListener('observacion:created', refrescarDetalleTrabajador)
    source.addEventListener('observacion:updated', refrescarDetalleTrabajador)
    source.addEventListener('observacion:deleted', refrescarDetalleTrabajador)
    source.addEventListener('curso:created', refrescarDetalleTrabajador)
    source.addEventListener('curso:updated', refrescarDetalleTrabajador)
    source.addEventListener('curso:deleted', refrescarDetalleTrabajador)
    source.addEventListener('calendario:created', refrescarDetalleTrabajador)
    source.addEventListener('calendario:updated', refrescarDetalleTrabajador)
    source.addEventListener('calendario:deleted', refrescarDetalleTrabajador)

    source.onerror = () => {}

    return () => source.close()
  }, [queryClient])
}
