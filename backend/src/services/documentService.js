function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toPublicDocument(document) {
  const { storedName, ...publicDocument } = document;
  return publicDocument;
}

function createDocumentService({
  documentRepository,
  fileRepository,
  maxDocumentsPerOwner,
  logger = console,
}) {
  async function removeUploadedFile(storedName) {
    try {
      await fileRepository.remove(storedName);
    } catch (error) {
      logger.error('Falha ao remover arquivo de upload sem metadados.', {
        storedName,
        error: error.message,
      });
    }
  }

  async function createDocument(file, owner) {
    if (!file) {
      throw createError('Arquivo não informado.', 400);
    }

    if (documentRepository.countByOwner(owner) >= maxDocumentsPerOwner) {
      await removeUploadedFile(file.filename);
      throw createError('Limite de documentos do usuário atingido.', 409);
    }

    const document = {
      id: file.filename,
      originalName: file.originalname,
      storedName: file.filename,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      mimeType: file.mimetype,
    };

    try {
      documentRepository.create(document);
    } catch (error) {
      await removeUploadedFile(file.filename);
      throw error;
    }

    return toPublicDocument(document);
  }

  function listDocuments(owner) {
    return documentRepository.findByOwner(owner).map(toPublicDocument);
  }

  async function getDocumentDownload(id, owner) {
    const document = documentRepository.findById(id);

    if (!document) {
      throw createError('Documento não encontrado.', 404);
    }

    if (document.owner !== owner) {
      throw createError('Acesso ao documento não autorizado.', 403);
    }

    try {
      return {
        filePath: await fileRepository.getFilePath(document.storedName),
        originalName: document.originalName,
        mimeType: document.mimeType,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw createError('Arquivo do documento não encontrado.', 404);
      }
      throw error;
    }
  }

  return { createDocument, listDocuments, getDocumentDownload };
}

module.exports = { createDocumentService };