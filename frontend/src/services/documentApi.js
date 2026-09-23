const API_PREFIX = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Não foi possível concluir a operação.');
  }

  return response;
}

function ownerHeaders(owner) {
  return { 'X-User-Id': owner };
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    headers: ownerHeaders(owner),
    body: formData,
  });

  return response.json();
}

export async function listDocuments(owner) {
  const response = await request('/documents', {
    headers: ownerHeaders(owner),
  });
  const body = await response.json();
  return body.documents;
}

export async function downloadDocument(document, owner) {
  const response = await request(`/documents/${document.id}/download`, {
    headers: ownerHeaders(owner),
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = url;
  link.download = document.originalName;
  link.click();
  URL.revokeObjectURL(url);
}