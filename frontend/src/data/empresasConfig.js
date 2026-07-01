const STORE_KEY = 'vdt_page_labels'
const PAGE_KEY = 'inicio'
const LIST_KEY = 'empresas'

const defaults = [
  { label: 'VDT', dbValue: 'VDT', color: '#8b5cf6' },
  { label: 'Alpa', dbValue: 'Alpa', color: '#22c55e' },
  { label: 'Chifu', dbValue: 'Chifu', color: '#f59e0b' },
]

function normalizar(lista) {
  return lista.map(e => ({
    ...e,
    dbValue: e.dbValue || e.label,
    label: e.label || e.dbValue || '',
  }))
}

export function cargarEmpresas() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const all = JSON.parse(raw)
      const lista = all[PAGE_KEY]?.[LIST_KEY]
      if (Array.isArray(lista) && lista.length) return normalizar(lista)
    }
  } catch {}
  return defaults
}
