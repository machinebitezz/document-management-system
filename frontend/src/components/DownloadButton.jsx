import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document, owner }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', isError: false });
  const feedbackId = `download-feedback-${document.id}`;

  async function handleDownload() {
    setIsDownloading(true);
    setFeedback({ message: '', isError: false });

    try {
      await downloadDocument(document, owner);
      setFeedback({
        message: `Download de ${document.originalName} iniciado.`,
        isError: false,
      });
    } catch (downloadError) {
      setFeedback({ message: downloadError.message, isError: true });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button
        className="download-button"
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label={`${isDownloading ? 'Baixando' : 'Baixar'} ${document.originalName}`}
        aria-describedby={feedback.message ? feedbackId : undefined}
      >
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {feedback.message && (
        <span
          id={feedbackId}
          className={feedback.isError ? 'inline-error' : 'visually-hidden'}
          role={feedback.isError ? 'alert' : 'status'}
        >
          {feedback.message}
        </span>
      )}
    </div>
  );
}