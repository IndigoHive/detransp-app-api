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
1. Instale as dependencias:
```bash
npm install
```
2. Crie o arquivo `.env` baseado em `.env.example`.
3. Rode em desenvolvimento:
```bash
npm run dev
```
4. Gere o build de producao:
```bash
npm run build
```

## Endpoints
- `GET /api/health`
- `GET /api/flows`
