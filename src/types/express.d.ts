import type { AwilixContainer } from 'awilix';

declare global {
  namespace Express {
    interface Request {
      container: AwilixContainer;
    }
  }
}

export {};
