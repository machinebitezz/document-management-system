const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const { loadConfig } = require('./config');
const { createDocumentRepository } = require('./repositories/documentRepository');
const { createFileRepository } = require('./repositories/fileRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRouter } = require('./routes/documentRoutes');

function createApp(config = loadConfig()) {
  fs.mkdirSync(config.storageDirectory, { recursive: true });

  const documentRepository = createDocumentRepository();
  const fileRepository = createFileRepository(config.storageDirectory);
  const documentService = createDocumentService({
    documentRepository,
    fileRepository,
    maxDocumentsPerOwner: config.maxDocumentsPerOwner,
  });
  const documentController = createDocumentController(documentService, config);
  const documentRouter = createDocumentRouter(documentController, config);
  const app = express();

  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use(documentRouter);
  app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error instanceof multer.MulterError) {
      const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'O arquivo excede o tamanho máximo permitido.'
        : 'Dados de upload inválidos.';
      return res.status(statusCode).json({ error: message });
    }

    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : 'Erro interno do servidor.',
    });
  });

  return app;
}

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
