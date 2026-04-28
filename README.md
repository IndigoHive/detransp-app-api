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
  app.ts
  server.ts
  container.ts
  config/
    env.ts
  db/
    pool.ts
  repositories/
    userRepository.ts
  services/
    userService.ts
  routes/
    healthRoutes.ts
    userRoutes.ts
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
- `GET /api/users`

## Observacao de banco
A rota `GET /api/users` espera uma tabela `users` com colunas: `id`, `name`, `email`.
