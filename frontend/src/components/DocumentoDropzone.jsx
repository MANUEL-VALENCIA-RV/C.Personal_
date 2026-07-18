import { useState } from 'react'
import { subirDocumento } from '../db/api.js'

const DOC_CAMPOS_KEY = 'vdt_doc_campos'
const CAMPOS_DEFAULT = [
  'Solicitud de empleo', 'INE', 'Comprobante de domicilio', 'CURP', 'RFC',
  'Comprobante de estudios', 'Curriculum', 'NSS', 'Licencia de conducir'
]

export function obtenerCamposDocumentos() {
  try {
    const raw = localStorage.getItem(DOC_CAMPOS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
    const labelsRaw = localStorage.getItem('vdt_page_labels')
    if (labelsRaw) {
      const labels = JSON.parse(labelsRaw)
      for (const key of ['editar', 'expediente', 'registro']) {
        const docs = labels?.[key]?.documentos
        if (Array.isArray(docs) && docs.length) {
          const campos = docs.map(d => d.label || d).filter(Boolean)
          if (campos.length) return campos
        }
      }
    }
  } catch {}
  return [...CAMPOS_DEFAULT]
}

export function guardarCamposDocumentos(campos) {
  localStorage.setItem(DOC_CAMPOS_KEY, JSON.stringify(campos))
}

export const documentacionCampos = obtenerCamposDocumentos()

export default function DocumentoDropzone({ campo, trabajadorId, doc, onUploadComplete }) {
  const [active, setActive] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = async (f) => {
    if (!f || !trabajadorId) return
    setSubiendo(true)
    setError(null)
    try {
      const resultado = await subirDocumento(trabajadorId, f, campo)
      onUploadComplete(campo, resultado.documento)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  const hasFile = !!doc

  return (
    <div 
      className={`doc-dropzone ${active ? 'active' : ''} ${hasFile ? 'has-file' : ''} ${subiendo ? 'uploading' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setActive(true) }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => { e.preventDefault(); setActive(false); handleFile(e.dataTransfer.files[0]) }}
      onClick={() => { if (!subiendo) document.getElementById(`file-${campo}`).click() }}
    >
      <span className="doc-name">{campo}</span>
      <span className="doc-status">
        {subiendo ? 'Subiendo...' : hasFile ? '✓ Cargado' : 'Arrastra o haz clic'}
      </span>
      {error && <span className="doc-error">{error}</span>}
      <input 
        id={`file-${campo}`}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={subiendo}
      />
    </div>
  )
}
