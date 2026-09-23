import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { listDocuments } from '../src/services/documentApi.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('lista documentos quando o contrato da API é válido', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    documents: [{
      id: 'document-1',
      originalName: 'arquivo.txt',
      size: 10,
      uploadedAt: '2026-09-23T12:00:00.000Z',
      owner: 'user-1',
    }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const documents = await listDocuments('user-1');
  assert.equal(documents.length, 1);
  assert.equal(documents[0].id, 'document-1');
});

test('rejeita contrato inválido e traduz falha de rede', async () => {
  globalThis.fetch = async () => new Response('{"documents":{}}', { status: 200 });
  await assert.rejects(listDocuments('user-1'), /lista de documentos inválida/);

  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };
  await assert.rejects(listDocuments('user-1'), /Não foi possível conectar ao servidor/);
});