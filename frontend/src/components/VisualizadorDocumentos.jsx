import { useState, useEffect } from 'react'
import { FileText, Image as ImageIcon, File, Eye, Trash2, X, Download } from 'lucide-react'
import { getToken } from '../db/api.js'

function IconoArchivo({ mime }) {
  if (mime?.startsWith('image/')) return <ImageIcon size={22} />
  if (mime === 'application/pdf') return <FileText size={22} />
  return <File size={22} />
}

function getProxyUrl(driveFileId) {
  const base = `${import.meta.env.VITE_API_URL || '/api'}/documentos/file`
  return `${base}/${driveFileId}`
}

function ModalPreview({ doc, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const isImage = doc.mimeType?.startsWith('image/')
  const isPdf = doc.mimeType === 'application/pdf'
  const proxyUrl = getProxyUrl(doc.driveFileId)

  useEffect(() => {
    let cancelled = false
    const url = getProxyUrl(doc.driveFileId)

    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(res => res.blob())
      .then(blob => {
        if (!cancelled) {
          setBlobUrl(URL.createObjectURL(blob))
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))

    return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [doc.driveFileId])

  const handleDownload = async () => {
    const res = await fetch(proxyUrl, { headers: { Authorization: `Bearer ${getToken()}` } })
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = doc.nombre || 'archivo'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="vis-modal-overlay" onClick={onClose}>
      <div className="vis-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="vis-modal-header">
          <span className="vis-modal-title">{doc.nombre}</span>
          <div className="vis-modal-actions">
            <button type="button" className="vis-modal-btn" onClick={handleDownload} title="Descargar">
              <Download size={16} /> Descargar
            </button>
            <button type="button" className="vis-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="vis-modal-body">
          {loading && <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>}
          {!loading && isImage && blobUrl && (
            <img src={blobUrl} alt={doc.nombre} className="vis-modal-image" />
          )}
          {!loading && isPdf && blobUrl && (
            <iframe src={blobUrl} className="vis-modal-iframe" title={doc.nombre} />
          )}
          {!loading && !isImage && !isPdf && (
            <div className="vis-modal-no-preview">
              <File size={48} />
              <p>Vista previa no disponible para este tipo de archivo.</p>
              <button type="button" className="vis-modal-btn vis-modal-btn-primary" onClick={handleDownload}>
                <Download size={16} /> Descargar archivo
              </button>
            </div>
          )}
          {!loading && !blobUrl && (
            <div className="vis-modal-no-preview">
              <File size={48} />
              <p>No se pudo cargar el archivo.</p>
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
