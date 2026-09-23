import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (!Number.isFinite(size) || size < 0) return 'Tamanho indisponível';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Data indisponível';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsedDate);
}

export default function DocumentList({ documents, owner, isLoading, error }) {
  const countLabel = `${documents.length} ${documents.length === 1 ? 'documento' : 'documentos'}`;

  return (
    <section
      className="documents-section"
      aria-labelledby="documents-title"
      aria-busy={isLoading}
    >
      <div className="section-heading">
        <div>
          <p className="section-kicker">Acervo</p>
          <h2 id="documents-title">Documentos</h2>
        </div>
        <span className="document-count">
          <span aria-hidden="true">{documents.length}</span>
          <span className="visually-hidden">{countLabel}</span>
        </span>
      </div>

      {isLoading && <p className="empty-state" role="status">Carregando documentos...</p>}
      {error && <p className="empty-state error-state" role="alert">{error}</p>}
      {!isLoading && !error && (
        <p className="visually-hidden" role="status" aria-live="polite">
          {`${countLabel} encontrado${documents.length === 1 ? '' : 's'}.`}
        </p>
      )}
      {!isLoading && !error && documents.length === 0 && (
        <p className="empty-state">Nenhum documento enviado.</p>
      )}

      {!isLoading && !error && documents.length > 0 && (
        <div className="document-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tamanho</th>
                <th>Enviado em</th>
                <th><span className="visually-hidden">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td data-label="Nome">{document.originalName}</td>
                  <td data-label="Tamanho">{formatFileSize(document.size)}</td>
                  <td data-label="Enviado em">{formatDate(document.uploadedAt)}</td>
                  <td className="action-cell">
                    <DownloadButton document={document} owner={owner} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}