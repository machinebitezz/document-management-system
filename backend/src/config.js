const path = require('node:path');

function positiveInteger(env, name, fallback) {
  const rawValue = env[name];

  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} deve ser um número inteiro positivo.`);
  }

  return value;
}

function parseAllowedMimeTypes(rawValue) {
  if (!rawValue) {
    return null;
  }

  const values = rawValue.split(',').map((value) => value.trim()).filter(Boolean);
  if (values.length === 0) {
    throw new Error('ALLOWED_MIME_TYPES deve conter ao menos um tipo MIME.');
  }

  return new Set(values);
}

function loadConfig(env = process.env) {
  return {
    port: positiveInteger(env, 'PORT', 3000),
    storageDirectory: path.resolve(
      env.STORAGE_PATH || path.resolve(__dirname, '../storage'),
    ),
    maxFileSize: positiveInteger(env, 'MAX_FILE_SIZE', 10 * 1024 * 1024),
    maxDocumentsPerOwner: positiveInteger(env, 'MAX_DOCUMENTS_PER_OWNER', 1000),
    uploadRateLimit: positiveInteger(env, 'UPLOAD_RATE_LIMIT', 30),
    uploadRateWindowMs: positiveInteger(env, 'UPLOAD_RATE_WINDOW_MS', 60 * 1000),
    maxOwnerLength: positiveInteger(env, 'MAX_OWNER_LENGTH', 128),
    allowedMimeTypes: parseAllowedMimeTypes(env.ALLOWED_MIME_TYPES),
  };
}

module.exports = { loadConfig };