import { useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ owner, onUploaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!file) {
      setMessage('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      const document = await uploadDocument(file, owner);
      setFile(null);
      form.reset();
      setMessage('Documento enviado com sucesso.');
      onUploaded(document);
    } catch (error) {
      setMessage(error.message);
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
      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-field">
          <span>{file ? file.name : 'Selecionar arquivo'}</span>
          <input
            type="file"
            onChange={(event) => setFile(event.target.files[0] || null)}
            disabled={isUploading}
          />
        </label>
        <button type="submit" disabled={isUploading || !owner.trim()}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {message && <p className="form-message" role="status">{message}</p>}
    </section>
  );
}