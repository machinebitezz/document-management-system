# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para upload, listagem e download de documentos, com gestão simples por usuário e armazenamento exclusivamente no filesystem local.

## 2. Escopo

### Dentro do escopo

- Upload de documentos.
- Listagem de documentos.
- Download por identificador.
- Associação de documentos a um usuário.
- Validação básica de entrada.
- Persistência dos arquivos em `backend/storage`.
- Persistência dos metadados em memória.
- Interface React para as operações principais.
- Tratamento de erros HTTP e mensagens ao usuário.

### Fora do escopo

- Autenticação e autorização completas.
- Armazenamento em nuvem ou serviços externos.
- Versionamento de documentos.
- Exclusão ou edição de documentos.
- Busca avançada e filtros persistentes.
- Banco de dados.
- Compartilhamento entre usuários.
- Pré-visualização de arquivos.
- Limpeza automática de arquivos órfãos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário deve conseguir enviar um documento usando `multipart/form-data`. |
| RF-02 | O upload deve exigir um arquivo no campo `file`. |
| RF-03 | Cada documento deve receber um identificador único. |
| RF-04 | O sistema deve registrar o nome original, tamanho, data de upload e proprietário. |
| RF-05 | O sistema deve associar o documento ao usuário informado pela requisição. |
| RF-06 | O usuário deve conseguir listar os documentos disponíveis para ele. |
| RF-07 | A listagem deve retornar somente metadados, sem conteúdo binário. |
| RF-08 | O usuário deve conseguir baixar um documento pelo identificador. |
| RF-09 | O download deve retornar o conteúdo binário do arquivo. |
| RF-10 | O sistema deve rejeitar requisições sem arquivo. |
| RF-11 | O sistema deve retornar erro quando o documento solicitado não existir. |
| RF-12 | O sistema deve impedir o acesso direto a caminhos arbitrários do filesystem. |
| RF-13 | O backend deve expor um endpoint de verificação de saúde. |
| RF-14 | O frontend deve apresentar estados de carregamento, sucesso e erro. |
| RF-15 | O frontend deve permitir selecionar um arquivo, enviá-lo, listar documentos e iniciar downloads. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser armazenados localmente via `multer` usando `diskStorage`. |
| RNF-02 | A pasta padrão de armazenamento deve ser `backend/storage`. |
| RNF-03 | Os metadados devem permanecer em memória nesta primeira versão. |
| RNF-04 | O backend deve usar Node.js, Express e CommonJS. |
| RNF-05 | O frontend deve usar React, Vite e ESM. |
| RNF-06 | A comunicação do frontend deve usar `fetch` através do prefixo `/api`. |
| RNF-07 | O backend deve seguir o fluxo `routes -> controllers -> services -> repositories`. |
| RNF-08 | Controllers devem cuidar de HTTP e validações básicas. |
| RNF-09 | Services devem concentrar as regras de negócio. |
| RNF-10 | Repositories devem abstrair arquivos e metadados. |
| RNF-11 | Configurações como porta, limites e diretório devem usar variáveis de ambiente quando aplicável. |
| RNF-12 | O sistema deve tratar erros de entrada, filesystem e documentos inexistentes. |
| RNF-13 | O sistema deve manter compatibilidade com os testes nativos do Node (`node:test`). |
| RNF-14 | O sistema não deve depender de provedores externos de armazenamento. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único do documento. |
| `originalName` | string | Sim | Nome original enviado pelo usuário. |
| `storedName` | string | Sim | Nome interno usado no filesystem. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601. |
| `owner` | string | Sim | Identificador do usuário proprietário. |
| `mimeType` | string | Não | Tipo MIME informado pelo upload. |
| `storagePath` | string | Sim, interno | Caminho controlado pelo repository; não deve ser exposto na API. |

Exemplo de resposta pública:

```json
{
  "id": "7f7b7d8e-9d9b-4a2c-9de0-2f4c9d4d6f1a",
  "originalName": "contrato.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-23T12:00:00.000Z",
  "owner": "user-123",
  "mimeType": "application/pdf"
}
```

Os metadados devem ser armazenados em uma coleção em memória. O conteúdo deve ser gravado em `backend/storage`, preferencialmente com um nome interno baseado no identificador do documento, evitando colisões e dependência do nome original.

## 6. Identificação do usuário

Como não haverá autenticação nesta versão, o usuário será informado pelo header:

```http
X-User-Id: user-123
```

Regras:

- O header deve ser obrigatório nas operações de upload e listagem.
- O valor deve ser uma string não vazia.
- O owner registrado deve ser o valor validado do header.
- A ausência ou invalidade do identificador deve retornar `400 Bad Request`.

## 7. Contratos de API

### GET `/health`

Verifica se o backend está disponível.

Resposta `200`:

```json
{
  "status": "ok"
}
```

### POST `/upload`

Envia um documento.

Headers:

```http
X-User-Id: user-123
Content-Type: multipart/form-data
```

Campo obrigatório: `file`.

Resposta `201`:

```json
{
  "id": "7f7b7d8e-9d9b-4a2c-9de0-2f4c9d4d6f1a",
  "originalName": "contrato.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-23T12:00:00.000Z",
  "owner": "user-123",
  "mimeType": "application/pdf"
}
```

Erros: `400` para usuário ou arquivo ausente, `413` para limite excedido e `500` para falha de persistência.

### GET `/documents`

Lista os documentos do usuário.

Header obrigatório: `X-User-Id`.

Resposta `200`:

```json
{
  "documents": [
    {
      "id": "7f7b7d8e-9d9b-4a2c-9de0-2f4c9d4d6f1a",
      "originalName": "contrato.pdf",
      "size": 24576,
      "uploadedAt": "2026-09-23T12:00:00.000Z",
      "owner": "user-123",
      "mimeType": "application/pdf"
    }
  ]
}
```

### GET `/documents/:id/download`

Baixa um documento do usuário.

Resposta `200`: corpo binário, `Content-Type` compatível e `Content-Disposition` com o nome original.

Erros: `400` para identificador inválido, `403` para documento de outro usuário, `404` para documento ou arquivo inexistente e `500` para falha de leitura.

### Formato de erro

```json
{
  "error": "Descrição objetiva do erro."
}
```

## 8. Decisões arquiteturais

### Backend

O backend seguirá a Clean Architecture simples:

```text
backend/src/
├── app.js
├── routes/
├── controllers/
├── services/
└── repositories/
```

- `routes/` registra endpoints, middleware do `multer` e controllers.
- `controllers/` interpreta requisições, valida entradas básicas e produz respostas HTTP.
- `services/` aplica regras de negócio e coordena operações.
- `repositories/` grava e lê arquivos locais e mantém metadados em memória.
- `app.js` configura o Express, middlewares, rotas e endpoint de saúde.

O `multer` deve usar `diskStorage` e gravar exclusivamente em `backend/storage`. O nome original nunca deve ser usado diretamente como caminho de armazenamento.

### Frontend

O frontend seguirá a organização por componentes:

```text
frontend/src/
├── App.jsx
├── components/
├── pages/
└── services/
```

- `services/` realiza chamadas com `fetch` através do prefixo `/api`.
- `components/` contém upload, lista e mensagens de estado.
- `pages/` compõe as telas.
- `App.jsx` compõe a aplicação principal.

## 9. Plano de execução

### Etapa 1 - Estrutura e configuração

- Configurar armazenamento local e variáveis de ambiente.
- Confirmar o proxy `/api` do Vite.
- Manter o endpoint `/health` funcionando.

### Etapa 2 - Repositories

- Implementar repository de documentos em memória.
- Implementar repository de arquivos locais.
- Garantir que caminhos do filesystem não sejam expostos.

### Etapa 3 - Service de documentos

- Implementar upload, listagem e download.
- Validar proprietário e identificador.
- Tratar arquivos órfãos em falhas de persistência.

### Etapa 4 - Rotas e controllers

- Implementar `POST /upload`.
- Implementar `GET /documents`.
- Implementar `GET /documents/:id/download`.
- Padronizar respostas e erros HTTP.

### Etapa 5 - Testes do backend

- Testar saúde da aplicação.
- Testar upload válido e upload sem arquivo.
- Testar listagem filtrada por usuário.
- Testar download válido, documento inexistente e acesso indevido.

### Etapa 6 - Frontend

- Implementar serviço HTTP.
- Criar componentes de upload e listagem.
- Adicionar estados de carregamento, sucesso e erro.
- Integrar o download dos documentos.

### Etapa 7 - Integração e validação

- Validar o fluxo upload -> listagem -> download.
- Executar `npm test` no backend.
- Executar `npm run build` no frontend.
- Confirmar armazenamento exclusivamente local.
- Confirmar aderência ao fluxo `routes -> controllers -> services -> repositories`.

## 10. Critérios de aceite

- Um usuário consegue enviar um arquivo e recebe seus metadados.
- O arquivo enviado existe em `backend/storage`.
- A listagem retorna apenas documentos do usuário informado.
- O download retorna o arquivo correto pelo identificador.
- Usuários não acessam documentos de outros usuários.
- Requisições inválidas recebem status HTTP e erro JSON adequados.
- O reinício do backend pode perder metadados, conforme a limitação aceita desta versão.
- Nenhum armazenamento externo ou banco de dados é utilizado.
- O backend mantém testes automatizados e o frontend compila com sucesso.