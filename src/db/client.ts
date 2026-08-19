import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { loadEnvConfig } from "@next/env";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

/**
 * Fora do runtime do Next (scripts rodados com tsx, drizzle-kit), .env.local
 * não é carregado automaticamente — sem isso, TURSO_DATABASE_URL nunca chega
 * aqui quando rodamos `npm run seed`/`npm run db:push` fora do `next dev`.
 * Dentro do Next isso é um no-op inofensivo (ele já carregou tudo antes).
 */
loadEnvConfig(process.cwd());

/**
 * Local (dev/self-host): usa um arquivo SQLite em disco (data/app.db).
 * Produção sem disco persistente (ex.: Netlify): defina TURSO_DATABASE_URL
 * (e TURSO_AUTH_TOKEN) apontando para um banco Turso gratuito — o mesmo
 * driver libSQL fala com os dois, então nada mais no código muda.
 */
const url = process.env.TURSO_DATABASE_URL ?? getLocalFileUrl();
const authToken = process.env.TURSO_AUTH_TOKEN;

function getLocalFileUrl(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return `file:${path.join(dataDir, "app.db")}`;
}

// Reaproveita a conexão entre hot-reloads em desenvolvimento
const globalForDb = globalThis as unknown as { __libsqlClient?: ReturnType<typeof createClient> };

const client = globalForDb.__libsqlClient ?? createClient({ url, authToken });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__libsqlClient = client;
}

if (!process.env.TURSO_DATABASE_URL) {
  // PRAGMAs só se aplicam ao arquivo local; um banco Turso remoto já vem configurado.
  // Sem top-level await de propósito: scripts rodados via tsx (CJS) não suportam a
  // sintaxe, e a própria libsql serializa os comandos na mesma conexão, então este
  // PRAGMA sempre termina antes de qualquer query disparada depois dele no import.
  void client.execute("PRAGMA foreign_keys = ON");
}

export const db = drizzle(client, { schema });
export { client };
