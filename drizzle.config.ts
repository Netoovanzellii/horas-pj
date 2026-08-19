import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// drizzle-kit roda fora do Next.js, então .env.local não é carregado
// automaticamente — sem isso, TURSO_DATABASE_URL nunca chega aqui.
loadEnvConfig(process.cwd());

const tursoUrl = process.env.TURSO_DATABASE_URL;

export default tursoUrl
  ? defineConfig({
      schema: "./src/db/schema.ts",
      out: "./drizzle",
      dialect: "turso",
      dbCredentials: {
        url: tursoUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      },
    })
  : defineConfig({
      schema: "./src/db/schema.ts",
      out: "./drizzle",
      dialect: "sqlite",
      dbCredentials: {
        url: "./data/app.db",
      },
    });
