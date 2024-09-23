import { UserModel } from "#src/models/user.js";
import "hono";
declare module 'hono' {
  interface ContextVariableMap {
    crateId: string,
    offset: number,
    limit: number,
    range: {
      start: number,
      end: number,
      size: number
    },
    bearer: string,
    user: UserModel,
    host: string,
    protocol: string,
    baseUrl: string,
    url: URL,
    format: string
  }
}

