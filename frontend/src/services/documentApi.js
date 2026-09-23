const API_PREFIX = '/api';

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_PREFIX}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Não foi possível concluir a operação.');
  }

  return response;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    throw new Error('O servidor retornou uma resposta inválida.');
  }
}

function isDocument(document) {
  return document
    && typeof document.id === 'string'
    && typeof document.originalName === 'string'
    && Number.isFinite(document.size)
    && typeof document.uploadedAt === 'string'
    && typeof document.owner === 'string';
}

function ownerHeaders(owner) {
  return { 'X-User-Id': owner };
}

export async function uploadDocument(file, owner, { signal } = {}) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    headers: ownerHeaders(owner),
    body: formData,
    signal,
  });
  const document = await readJson(response);

  if (!isDocument(document)) {
    throw new Error('O servidor retornou metadados de documento inválidos.');
  }

  return document;
}

export async function listDocuments(owner, { signal } = {}) {
  const response = await request('/documents', {
    headers: ownerHeaders(owner),
    signal,
  });
  const body = await readJson(response);

  if (!Array.isArray(body.documents) || !body.documents.every(isDocument)) {
    throw new Error('O servidor retornou uma lista de documentos inválida.');
  }

  return body.documents;
}

export async function downloadDocument(document, owner) {
  const response = await request(`/documents/${encodeURIComponent(document.id)}/download`, {
    headers: ownerHeaders(owner),
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = url;
  link.download = document.originalName;
  link.hidden = true;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}