function createDocumentController(documentService, { maxOwnerLength }) {
  function requireOwner(req, res, next) {
    const owner = req.get('X-User-Id');
    const normalizedOwner = owner?.trim();

    if (!normalizedOwner) {
      return res.status(400).json({ error: 'O header X-User-Id é obrigatório.' });
    }

    if (normalizedOwner.length > maxOwnerLength) {
      return res.status(400).json({ error: 'O identificador do usuário é muito longo.' });
    }

    req.owner = normalizedOwner;
    return next();
  }

  async function upload(req, res, next) {
    try {
      const document = await documentService.createDocument(req.file, req.owner);
      return res.status(201).json(document);
    } catch (error) {
      return next(error);
    }
  }

  function list(req, res, next) {
    try {
      return res.json({ documents: documentService.listDocuments(req.owner) });
    } catch (error) {
      return next(error);
    }
  }

  async function download(req, res, next) {
    try {
      const document = await documentService.getDocumentDownload(req.params.id, req.owner);
      res.type(document.mimeType);
      return res.download(document.filePath, document.originalName, (error) => {
        if (error) next(error);
      });
    } catch (error) {
      return next(error);
    }
  }

  return { requireOwner, upload, list, download };
}

module.exports = { createDocumentController };