import { useState } from 'react'

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

export default function DocumentoDropzone({ campo, file, onFileChange }) {
  const [active, setActive] = useState(false)

  const handleFile = (f) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = (e) => onFileChange(campo, e.target.result)
    reader.readAsDataURL(f)
  }

  return (
    <div 
      className={`doc-dropzone ${active ? 'active' : ''} ${file ? 'has-file' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setActive(true) }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => { e.preventDefault(); setActive(false); handleFile(e.dataTransfer.files[0]) }}
      onClick={() => document.getElementById(`file-${campo}`).click()}
    >
      <span className="doc-name">{campo}</span>
      <span className="doc-status">{file ? '✓ Cargado' : 'Arrastra o haz clic'}</span>
      <input 
        id={`file-${campo}`}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {file && (
        <button 
          type="button"
          className="doc-remove" 
          onClick={(e) => { e.stopPropagation(); onFileChange(campo, null) }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
