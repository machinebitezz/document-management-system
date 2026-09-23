const fs = require('node:fs/promises');
const path = require('node:path');

function createFileRepository(storageDirectory) {
  const storageRoot = path.resolve(storageDirectory);

  function resolveStoredPath(storedName) {
    if (
      typeof storedName !== 'string'
      || storedName.length === 0
      || path.basename(storedName) !== storedName
    ) {
      throw new Error('Nome interno de arquivo inválido.');
    }

    const filePath = path.resolve(storageRoot, storedName);
    if (path.dirname(filePath) !== storageRoot) {
      throw new Error('Arquivo fora do diretório de armazenamento.');
    }

    return filePath;
  }

  async function getFilePath(storedName) {
    const filePath = resolveStoredPath(storedName);
    const fileStat = await fs.lstat(filePath);

    if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
      const error = new Error('Arquivo armazenado inválido.');
      error.code = 'ENOENT';
      throw error;
    }

    return filePath;
  }

  async function remove(storedName) {
    const filePath = resolveStoredPath(storedName);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  return { getFilePath, remove, resolveStoredPath };
}

module.exports = { createFileRepository };