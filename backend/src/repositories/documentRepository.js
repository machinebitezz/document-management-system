function createDocumentRepository() {
  const documents = new Map();

  function create(document) {
    if (documents.has(document.id)) {
      throw new Error('Já existe um documento com este identificador.');
    }

    documents.set(document.id, document);
    return document;
  }

  function findByOwner(owner) {
    return Array.from(documents.values()).filter((document) => document.owner === owner);
  }

  function findById(id) {
    return documents.get(id);
  }

  function countByOwner(owner) {
    let count = 0;
    for (const document of documents.values()) {
      if (document.owner === owner) count += 1;
    }
    return count;
  }

  return { create, findByOwner, findById, countByOwner };
}

module.exports = { createDocumentRepository };