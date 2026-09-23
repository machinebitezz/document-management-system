const documentService = require('../services/documentService');

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id');

  if (!owner || !owner.trim()) {
    return res.status(400).json({ error: 'O header X-User-Id é obrigatório.' });
  }

  req.owner = owner.trim();
  return next();
}

function upload(req, res, next) {
  try {
    const document = documentService.createDocument(req.file, req.owner);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

function list(req, res, next) {
  try {
    const documents = documentService.listDocuments(req.owner);
    return res.json({ documents });
  } catch (error) {
    return next(error);
  }
}

function download(req, res, next) {
  try {
    const document = documentService.getDocumentDownload(req.params.id, req.owner);
    res.type(document.mimeType);
    return res.download(document.filePath, document.originalName, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireOwner,
  upload,
  list,
  download,
};