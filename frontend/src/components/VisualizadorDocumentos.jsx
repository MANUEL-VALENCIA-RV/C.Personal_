import { FileText, Image as ImageIcon, File, Eye } from 'lucide-react'

function IconoArchivo({ mime }) {
  if (mime?.startsWith('image/')) return <ImageIcon size={22} />
  if (mime === 'application/pdf') return <FileText size={22} />
  return <File size={22} />
}

export default function VisualizadorDocumentos({ documentos = [], campos = [] }) {
  const documentosArray = Array.isArray(documentos) ? documentos : []
  
  const docsPorCampo = campos.map(campo => {
    const doc = documentosArray.find(d => d.nombre === campo)
    return { campo, doc }
  })

  const conDoc = docsPorCampo.filter(d => d.doc)

  if (conDoc.length === 0) {
    return (
      <div className="vis-docs-empty">
        <FileText size={28} />
        <p>Aún no hay documentos guardados para este trabajador.</p>
      </div>
    )
  }

  return (
    <div className="vis-docs-grid">
      {docsPorCampo.map(({ campo, doc }) => {
        if (!doc) return null

        return (
          <div key={campo} className="vis-doc-card">
            <div className="vis-doc-preview">
              <div className="vis-doc-icono">
                <IconoArchivo mime={doc.mimeType} />
              </div>
            </div>
            <div className="vis-doc-info">
              <span className="vis-doc-nombre" title={campo}>{campo}</span>
              <div className="vis-doc-acciones">
                <a 
                  href={doc.webViewLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="vis-doc-btn" 
                  title="Ver en Google Drive"
                >
                  <Eye size={14} /> Ver
                </a>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
