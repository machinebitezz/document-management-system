import { useEffect, useRef, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [owner, setOwner] = useState('user-123');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const ownerRef = useRef(owner.trim());
  const loadVersionRef = useRef(0);
  const normalizedOwner = owner.trim();

  useEffect(() => {
    const loadVersion = ++loadVersionRef.current;
    const abortController = new AbortController();

    async function loadDocuments() {
      if (!normalizedOwner) {
        setDocuments([]);
        setError('');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const result = await listDocuments(normalizedOwner, {
          signal: abortController.signal,
        });
        if (loadVersion === loadVersionRef.current) setDocuments(result);
      } catch (loadError) {
        if (loadError.name !== 'AbortError' && loadVersion === loadVersionRef.current) {
          setError(loadError.message);
        }
      } finally {
        if (loadVersion === loadVersionRef.current) setIsLoading(false);
      }
    }

    setIsLoading(Boolean(normalizedOwner));
    const timeout = window.setTimeout(loadDocuments, 250);

    return () => {
      window.clearTimeout(timeout);
      abortController.abort();
    };
  }, [normalizedOwner, refreshVersion]);

  function handleOwnerChange(event) {
    ownerRef.current = event.target.value.trim();
    loadVersionRef.current += 1;
    setDocuments([]);
    setError('');
    setOwner(event.target.value);
  }

  function handleUploaded(document, uploadedOwner) {
    if (ownerRef.current !== uploadedOwner) return;

    loadVersionRef.current += 1;
    setDocuments((currentDocuments) => [
      document,
      ...currentDocuments.filter((currentDocument) => currentDocument.id !== document.id),
    ]);
    setError('');
    setRefreshVersion((currentVersion) => currentVersion + 1);
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
            onChange={handleOwnerChange}
            placeholder="Identificador"
            disabled={isUploading}
          />
        </label>
      </header>

      <UploadComponent
        owner={normalizedOwner}
        onUploaded={handleUploaded}
        onUploadingChange={setIsUploading}
      />
      <DocumentList
        documents={documents}
        owner={normalizedOwner}
        isLoading={isLoading}
        error={error}
      />
    </main>
  );
}
