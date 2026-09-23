const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');

function createUploadRateLimiter({ maxRequests, windowMs }) {
  const attempts = new Map();

  return function uploadRateLimiter(req, res, next) {
    const now = Date.now();
    const key = `${req.ip}:${req.owner}`;
    const current = attempts.get(key);

    if (attempts.size > 1000) {
      for (const [attemptKey, attempt] of attempts) {
        if (attempt.expiresAt <= now) attempts.delete(attemptKey);
      }
    }

    if (!current || current.expiresAt <= now) {
      attempts.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      return res.status(429).json({ error: 'Muitos uploads. Tente novamente mais tarde.' });
    }

    current.count += 1;
    return next();
  };
}

function createDocumentRouter(documentController, config) {
  const router = express.Router();
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, config.storageDirectory);
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: config.maxFileSize, files: 1 },
    fileFilter(req, file, callback) {
      if (config.allowedMimeTypes && !config.allowedMimeTypes.has(file.mimetype)) {
        const error = new Error('Tipo de arquivo não permitido.');
        error.statusCode = 415;
        return callback(error);
      }
      return callback(null, true);
    },
  });
  const uploadRateLimiter = createUploadRateLimiter({
    maxRequests: config.uploadRateLimit,
    windowMs: config.uploadRateWindowMs,
  });

  router.use(documentController.requireOwner);
  router.get('/documents', documentController.list);
  router.post('/upload', uploadRateLimiter, upload.single('file'), documentController.upload);
  router.get('/documents/:id/download', documentController.download);

  return router;
}

module.exports = { createDocumentRouter };