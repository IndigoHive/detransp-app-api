# detransp-app-api

API Node.js com TypeScript, Express, PostgreSQL (`pg`) e injecao de dependencias com Awilix, seguindo o padrao de `Services` e `Repositories`.

## Stack
- Express
- pg
- awilix
- dotenv
- TypeScript

## Estrutura
```text
src/
  index.ts
  app/
    create-app.ts
    index.ts
    middlewares/
      scope-per-request/
    routers/
      flows-router.ts
      health-router.ts
      index.ts
  container/
    config/
      config.ts
      env.ts
    create-container/
    types/
      container-services.ts
      repository-services.ts
  db/
    pool.ts
  repositories/
    pg-flow-repository.ts
    types/
      flow-repository.ts
  services/
    flows/
      flows-services.ts
      list-flows-service/
  types/
    config.ts
    list-flows.ts
    user.ts
```

## Ecossistema

| Ordem | Repositório | Papel | Porta local |
| --- | --- | --- | --- |
| 1 | [detransp-app-editor](https://github.com/IndigoHive/detransp-app-editor) | Cria/publica flows e é dono do schema do Postgres | web `5173`, api `3000` |
| 2 | [detransp-app-api](https://github.com/IndigoHive/detransp-app-api) (este) | BFF que serve os flows publicados (lê o mesmo Postgres) | `3500` |
| 3 | [detransp-app](https://github.com/IndigoHive/detransp-app) | App React Native (Expo) | Metro `8081` |

```text
Editor (cria/publica flows) → Postgres → App-API (serve flows e dados) → App
```

## Pré-requisitos

Funciona em macOS, Linux e Windows. No Windows use PowerShell ou WSL2 (não use o `cmd.exe`).

| Ferramenta | Versão | Observação |
| --- | --- | --- |
| Git | qualquer | |
| Node.js | 24.x (`.nvmrc`) | npm 10+ já vem junto |
| Postgres | 16 com pgvector | Só na execução real. Use o `docker-compose.yml` do editor |

### Node.js

Qualquer gerenciador serve, desde que `node -v` mostre a versão do `.nvmrc`.

| Sistema | Gerenciador | Instalar | Usar |
| --- | --- | --- | --- |
| macOS / Linux | [nvm](https://github.com/nvm-sh/nvm) | ver documentação | `nvm install` e `nvm use` |
| Windows (e demais) | [fnm](https://github.com/Schniz/fnm) | `winget install Schniz.fnm` | `fnm install` e `fnm use` |

O `nvm-windows` não lê o `.nvmrc`: use `nvm install 24` e `nvm use 24`.

## Como executar

```bash
git clone https://github.com/IndigoHive/detransp-app-api.git
cd detransp-app-api
```

Selecione o Node (`nvm use` ou `fnm use`) e instale as dependências:

```bash
npm install
```

Escolha um dos modos abaixo.

### Modo mock (sem banco e sem credenciais)

Serve dados fictícios e os flows de `mock-data/`, com login simulado. Ideal para desenvolver o app sem depender de nada externo.

```bash
npm run dev:mock
```

Confirme em http://localhost:3500/api/health (responde `{"status":"ok","mode":"mock"}`).

### Modo real

1. Suba o Postgres e aplique as migrations seguindo o README do [detransp-app-editor](https://github.com/IndigoHive/detransp-app-editor) (seção "Banco de dados"). A API lê as tabelas `flow` e `flow_version` criadas por elas.
2. Crie `.env.development` a partir de `.env.example` (ignorado pelo git):

   ```bash
   cp .env.example .env.development
   ```

   O `npm run dev` carrega `.env.development.local` e `.env.development`, não o `.env`. Se `.env.development.local` existir, ele tem precedência: remova-o para rodar 100% local.

3. Preencha, no mínimo:

   ```bash
   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/detransp_app_dev"
   ```

   Variáveis vazias usam o padrão (`PORT` = `3500`). Os valores de gov.br (`GOVBR_IDSP_*`), ServiceNow, Rota SP e ITI são necessários para login e serviços reais: peça-os a outro dev.

   Sem acesso ao ServiceNow, `TDV_MOCK_ENABLED="true"` roda o fluxo de TDV contra um mock em memória (o login gov.br continua real). Em emulador sem câmera, `LIVENESS_BYPASS_MATCH="true"` pula o match facial. Ambos são só para dev/QA e estão detalhados no `.env.example`.

4. Rode em desenvolvimento:

   ```bash
   npm run dev
   ```

5. Confirme que o servidor está no ar abrindo http://localhost:3500/api/health/health (responde `{"status":"ok"}`). No terminal: `curl http://localhost:3500/api/health/health` (no PowerShell use `curl.exe`).

## Validação

```bash
npm run typecheck
npm test
npm run build
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | API real com reload (`tsx watch`) |
| `npm run dev:mock` | Servidor mock, sem banco |
| `npm run typecheck` | Verificação de tipos |
| `npm test` | Testes (vitest) |
| `npm run build` | Typecheck + build de produção em `dist/` |
| `npm start` | Executa `dist/index.cjs` (usa apenas variáveis do ambiente, não lê `.env`) |

## Problemas comuns

| Problema | Solução |
| --- | --- |
| `ECONNREFUSED 127.0.0.1:5432` | Postgres parado: `docker compose up -d` no repositório do editor |
| Porta `3500` ocupada | `npx kill-port 3500` (funciona em qualquer sistema) ou defina `PORT` |
| `.env` não tem efeito | O `dev` lê `.env.development` (e `.env.production.local`), não `.env` |
| `GET /api/flows` retorna 401 | A rota exige sessão; para flows sem login use `GET /api/flows/sessionless` |

## Endpoints
- `GET /api/health/health`
- `GET /api/flows`
- `GET /api/flows/sessionless`
- `GET /api/flows/:flowId`

## Referências

- `AGENTS.md`: padrões e convenções do projeto
- `.github/copilot-instructions.md`: arquitetura
- `docs/tdv/`: documentação do fluxo de TDV
