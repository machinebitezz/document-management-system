import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [owner, setOwner] = useState('user-123');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      if (!owner.trim()) {
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const result = await listDocuments(owner.trim());
        if (isCurrent) setDocuments(result);
      } catch (loadError) {
        if (isCurrent) setError(loadError.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [owner]);

  function handleUploaded(document) {
    setDocuments((currentDocuments) => [document, ...currentDocuments]);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DMS / Arquivo local</p>
          <h1>Document Management System</h1>
        </div>
        <label className="owner-field">
          <span>Usuário</span>
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Identificador"
          />
        </label>
      </header>

      <UploadComponent owner={owner.trim()} onUploaded={handleUploaded} />
      <DocumentList
        documents={documents}
        owner={owner.trim()}
        isLoading={isLoading}
        error={error}
      />
    </main>
  );
}
