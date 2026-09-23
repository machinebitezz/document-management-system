const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config');
const { createFileRepository } = require('../src/repositories/fileRepository');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

async function withTestServer(overrides, callback) {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-'));
  const config = {
    port: 3000,
    storageDirectory,
    maxFileSize: 1024,
    maxDocumentsPerOwner: 10,
    uploadRateLimit: 20,
    uploadRateWindowMs: 60_000,
    maxOwnerLength: 128,
    allowedMimeTypes: null,
    ...overrides,
  };
  const server = createApp(config).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await callback({ baseUrl, storageDirectory });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(storageDirectory, { recursive: true, force: true });
  }
}

async function upload(baseUrl, owner, content = 'conteúdo', field = 'file') {
  const form = new FormData();
  form.append(field, new Blob([content], { type: 'text/plain' }), 'arquivo.txt');
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });
}

test('POST /upload salva o arquivo e retorna metadados públicos', async () => {
  await withTestServer({}, async ({ baseUrl, storageDirectory }) => {
    const uploadResponse = await upload(baseUrl, 'user-1');
    assert.equal(uploadResponse.status, 201);
    const document = await uploadResponse.json();

    assert.equal(document.owner, 'user-1');
    assert.equal(document.originalName, 'arquivo.txt');
    assert.equal(document.size, Buffer.byteLength('conteúdo'));
    assert.match(document.uploadedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(document.storedName, undefined);
    assert.equal((await fs.readdir(storageDirectory)).length, 1);
  });
});

test('GET /documents lista apenas os documentos do usuário autenticado', async () => {
  await withTestServer({}, async ({ baseUrl }) => {
    const firstUpload = await upload(baseUrl, 'user-1', 'primeiro');
    const secondUpload = await upload(baseUrl, 'user-2', 'segundo');
    assert.equal(firstUpload.status, 201);
    assert.equal(secondUpload.status, 201);

    const firstDocument = await firstUpload.json();

    const listResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': 'user-1' },
    });
    assert.equal(listResponse.status, 200);
    const { documents } = await listResponse.json();
    assert.equal(documents.length, 1);
    assert.equal(documents[0].id, firstDocument.id);
    assert.equal(documents[0].owner, 'user-1');
  });
});

test('GET /documents/:id/download baixa o arquivo do usuário e bloqueia acesso indevido', async () => {
  await withTestServer({}, async ({ baseUrl }) => {
    const uploadResponse = await upload(baseUrl, 'user-1');
    assert.equal(uploadResponse.status, 201);
    const document = await uploadResponse.json();

    const forbiddenResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': 'user-2' },
    });
    assert.equal(forbiddenResponse.status, 403);

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': 'user-1' },
    });
    assert.equal(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /arquivo\.txt/);
    assert.equal(await downloadResponse.text(), 'conteúdo');
  });
});

test('aplica limite de arquivo, cota e erros JSON de upload', async () => {
  await withTestServer({ maxFileSize: 4, maxDocumentsPerOwner: 1 }, async ({ baseUrl }) => {
    assert.equal((await upload(baseUrl, 'user-1', 'grande')).status, 413);
    assert.equal((await upload(baseUrl, 'user-1', 'ok')).status, 201);
    assert.equal((await upload(baseUrl, 'user-1', 'x')).status, 409);
    assert.equal((await upload(baseUrl, 'user-2', 'ok', 'unexpected')).status, 400);

    const notFound = await fetch(`${baseUrl}/inexistente`, {
      headers: { 'X-User-Id': 'user-1' },
    });
    assert.equal(notFound.status, 404);
    assert.match(notFound.headers.get('content-type'), /application\/json/);
  });
});

test('repository de arquivos rejeita traversal e symlinks', async () => {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-files-'));
  const outsideDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-outside-'));
  const repository = createFileRepository(storageDirectory);

  try {
    assert.throws(() => repository.resolveStoredPath('../segredo.txt'), /inválido/);
    const outsideFile = path.join(outsideDirectory, 'segredo.txt');
    await fs.writeFile(outsideFile, 'segredo');
    await fs.symlink(outsideFile, path.join(storageDirectory, 'link'));
    await assert.rejects(repository.getFilePath('link'), { code: 'ENOENT' });
  } finally {
    await fs.rm(storageDirectory, { recursive: true, force: true });
    await fs.rm(outsideDirectory, { recursive: true, force: true });
  }
});

test('valida configuração numérica no startup', () => {
  assert.throws(
    () => loadConfig({ MAX_FILE_SIZE: '-1' }),
    /MAX_FILE_SIZE deve ser um número inteiro positivo/,
  );
  assert.equal(loadConfig({ MAX_FILE_SIZE: '2048' }).maxFileSize, 2048);
});

test('aplica allowlist de MIME e limite de frequência configuráveis', async () => {
  await withTestServer({
    allowedMimeTypes: new Set(['application/pdf']),
    uploadRateLimit: 1,
  }, async ({ baseUrl }) => {
    assert.equal((await upload(baseUrl, 'user-1')).status, 415);

    const form = new FormData();
    form.append('file', new Blob(['pdf'], { type: 'application/pdf' }), 'arquivo.pdf');
    const firstUpload = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-2' },
      body: form,
    });
    assert.equal(firstUpload.status, 201);
    assert.equal((await upload(baseUrl, 'user-2')).status, 429);
  });
});
