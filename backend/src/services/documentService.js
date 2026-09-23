const documentRepository = require('../repositories/documentRepository');
const fileRepository = require('../repositories/fileRepository');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toPublicDocument(document) {
  const { storagePath, ...publicDocument } = document;
  return publicDocument;
}

function createDocument(file, owner) {
  if (!file) {
    throw createError('Arquivo não informado.', 400);
  }

  const document = {
    id: file.filename,
    originalName: file.originalname,
    storedName: file.filename,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype,
    storagePath: file.path,
  };

  try {
    documentRepository.create(document);
  } catch (error) {
    fileRepository.remove(file.path);
    throw error;
  }

  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner).map(toPublicDocument);
}

function getDocumentDownload(id, owner) {
  const document = documentRepository.findById(id);

  if (!document) {
    throw createError('Documento não encontrado.', 404);
  }

  if (document.owner !== owner) {
    throw createError('Acesso ao documento não autorizado.', 403);
  }

  if (!fileRepository.exists(document.storagePath)) {
    throw createError('Arquivo do documento não encontrado.', 404);
  }

  return {
    filePath: document.storagePath,
    originalName: document.originalName,
    mimeType: document.mimeType,
  };
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentDownload,
};