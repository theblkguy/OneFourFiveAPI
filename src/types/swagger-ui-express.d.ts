declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';
  function serve(
    ...args: unknown[]
  ): RequestHandler[];
  function setup(spec: unknown, options?: unknown): RequestHandler;
}
