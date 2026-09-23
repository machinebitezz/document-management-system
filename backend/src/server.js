const app = require('./app');
const { loadConfig } = require('./config');

const { port } = loadConfig();

app.listen(port, () => {
  console.log(`DMS backend ouvindo na porta ${port}`);
});