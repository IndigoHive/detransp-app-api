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

## Como executar
1. Use a versao do Node.js definida no projeto:
```bash
nvm use
```
2. Instale as dependencias:
```bash
npm install
```
3. Peça o arquivo `.env.development` de outro dev para atualiza-lo.
4. Rode em desenvolvimento:
```bash
npm run dev
```
5. Gere o build de producao:
```bash
npm run build
```
6. Confirme que o server está funcional com:
```bash
curl http://localhost:3500/api/health/health
```

## Endpoints
- `GET /api/health`
- `GET /api/flows`
- `GET /api/flows/:flowId/published-flow-version`
- `GET /api/flows/:flowId/flow-json`
