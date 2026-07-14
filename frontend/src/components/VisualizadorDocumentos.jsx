import { FileText, Image as ImageIcon, File, Eye, Download } from 'lucide-react'

function detectarTipo(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null
  const match = dataUrl.match(/^data:([^;]+);/)
  return match ? match[1] : null
}

function IconoArchivo({ tipo }) {
  if (tipo?.startsWith('image/')) return <ImageIcon size={22} />
  if (tipo === 'application/pdf') return <FileText size={22} />
  return <File size={22} />
}

export default function VisualizadorDocumentos({ documentos = {}, campos = [] }) {
  const listaCampos = campos.length ? campos : Object.keys(documentos)
  const conArchivo = listaCampos.filter((c) => documentos[c])

  if (conArchivo.length === 0) {
    return (
      <div className="vis-docs-empty">
        <FileText size={28} />
        <p>Aún no hay documentos guardados para este trabajador.</p>
      </div>
    )
  }

  return (
    <div className="vis-docs-grid">
      {listaCampos.map((campo) => {
        const dato = documentos[campo]
        if (!dato) return null
        const tipo = detectarTipo(dato)
        const esImagen = tipo?.startsWith('image/')

        return (
          <div key={campo} className="vis-doc-card">
            <div className="vis-doc-preview">
              {esImagen ? (
                <img src={dato} alt={campo} />
              ) : (
                <div className="vis-doc-icono">
                  <IconoArchivo tipo={tipo} />
                </div>
              )}
            </div>
            <div className="vis-doc-info">
              <span className="vis-doc-nombre" title={campo}>{campo}</span>
              <div className="vis-doc-acciones">
                <a href={dato} target="_blank" rel="noopener noreferrer" className="vis-doc-btn" title="Ver documento">
                  <Eye size={14} /> Ver
                </a>
                <a href={dato} download={`${campo}`} className="vis-doc-btn" title="Descargar documento">
                  <Download size={14} /> Descargar
                </a>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
