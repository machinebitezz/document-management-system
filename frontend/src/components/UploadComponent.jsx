import { useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ owner, onUploaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', isError: false });

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!file) {
      setFeedback({ message: 'Selecione um arquivo para enviar.', isError: true });
      return;
    }

    setIsUploading(true);
    setFeedback({ message: '', isError: false });

    try {
      const document = await uploadDocument(file, owner);
      setFile(null);
      form.reset();
      setFeedback({ message: 'Documento enviado com sucesso.', isError: false });
      onUploaded(document);
    } catch (error) {
      setFeedback({ message: error.message, isError: true });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div>
        <p className="section-kicker">Novo documento</p>
        <h2 id="upload-title">Enviar arquivo</h2>
      </div>
      <form className="upload-form" onSubmit={handleSubmit} aria-busy={isUploading}>
        <label className="file-field" htmlFor="document-file">
          <span className="visually-hidden">Arquivo para upload</span>
          <span aria-hidden="true">{file ? file.name : 'Selecionar arquivo'}</span>
          <input
            id="document-file"
            type="file"
            onChange={(event) => {
              setFile(event.target.files[0] || null);
              setFeedback({ message: '', isError: false });
            }}
            disabled={isUploading}
            aria-describedby={feedback.message ? 'upload-feedback' : undefined}
            aria-invalid={feedback.isError}
          />
        </label>
        <button type="submit" disabled={isUploading || !owner.trim()}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {feedback.message && (
        <p
          id="upload-feedback"
          className={`form-message${feedback.isError ? ' error-state' : ''}`}
          role={feedback.isError ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}
    </section>
  );
}