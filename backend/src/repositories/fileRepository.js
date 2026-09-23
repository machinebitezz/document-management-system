const fs = require('node:fs');

function exists(filePath) {
  return fs.existsSync(filePath);
}

function remove(filePath) {
  if (exists(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  exists,
  remove,
};