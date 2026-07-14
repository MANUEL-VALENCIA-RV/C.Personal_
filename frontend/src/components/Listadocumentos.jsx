export default function ListaDocumentos({ documentos = {} }) {
    const archivos = Object.entries(documentos).filter(
        ([, archivo]) => archivo
    )

    if (archivos.length === 0) {
        return (
            <div className="lista-documentos">
                <h2>📁 Documentación</h2>
                <p>No hay documentos cargados.</p>
            </div>
        )
    }

    return (
        <div className="lista-documentos">
            <h2>📁 Documentación</h2>

            {archivos.map(([campo, archivo]) => (
                <div key={campo} className="documento-item">
                    <div>
                        <strong>{campo}</strong>
                        <br />
                        <small>{archivo.nombre}</small>
                    </div>

                    <div className="acciones">
                        <a
                            href={archivo.data}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            👁 Ver
                        </a>

                        <a
                            href={archivo.data}
                            download={archivo.nombre}
                        >
                            ⬇ Descargar
                        </a>
                    </div>
                </div>
            ))}
        </div>
    )
}