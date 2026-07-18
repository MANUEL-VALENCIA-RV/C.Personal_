import { useState } from 'react'
import { FileText, Image as ImageIcon, File, Eye, Trash2, X, Download } from 'lucide-react'

function IconoArchivo({ mime }) {
  if (mime?.startsWith('image/')) return <ImageIcon size={22} />
  if (mime === 'application/pdf') return <FileText size={22} />
  return <File size={22} />
}

function getPreviewUrl(driveFileId, mimeType) {
  if (mimeType?.startsWith('image/')) {
    return `https://drive.google.com/uc?export=view&id=${driveFileId}`
  }
  if (mimeType === 'application/pdf') {
    return `https://drive.google.com/file/d/${driveFileId}/preview`
  }
  return null
}

function ModalPreview({ doc, onClose }) {
  const previewUrl = getPreviewUrl(doc.driveFileId, doc.mimeType)
  const isImage = doc.mimeType?.startsWith('image/')
  const isPdf = doc.mimeType === 'application/pdf'

  return (
    <div className="vis-modal-overlay" onClick={onClose}>
      <div className="vis-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="vis-modal-header">
          <span className="vis-modal-title">{doc.nombre}</span>
          <div className="vis-modal-actions">
            <a
              href={`https://drive.google.com/uc?export=download&id=${doc.driveFileId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="vis-modal-btn"
              title="Descargar"
            >
              <Download size={16} /> Descargar
            </a>
            <button type="button" className="vis-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="vis-modal-body">
          {isImage && previewUrl && (
            <img src={previewUrl} alt={doc.nombre} className="vis-modal-image" />
          )}
          {isPdf && previewUrl && (
            <iframe src={previewUrl} className="vis-modal-iframe" title={doc.nombre} />
          )}
          {!isImage && !isPdf && (
            <div className="vis-modal-no-preview">
              <File size={48} />
              <p>Vista previa no disponible para este tipo de archivo.</p>
              <a
                href={`https://drive.google.com/uc?export=download&id=${doc.driveFileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="vis-modal-btn vis-modal-btn-primary"
              >
                <Download size={16} /> Descargar archivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VisualizadorDocumentos({ documentos = [], campos = [], onDelete }) {
  const [previewDoc, setPreviewDoc] = useState(null)
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
    <>
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
                  <button
                    type="button"
                    className="vis-doc-btn"
                    title="Ver documento"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <Eye size={14} /> Ver
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      className="vis-doc-btn vis-doc-btn-danger"
                      title="Eliminar documento"
                      onClick={() => {
                        if (confirm(`¿Eliminar "${campo}"?`)) {
                          onDelete(doc.id, campo)
                        }
                      }}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {previewDoc && (
        <ModalPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </>
  )
}
