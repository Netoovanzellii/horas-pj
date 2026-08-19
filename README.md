# Controle de Horas PJ

Sistema web para controlar solicitações e apontamento de horas em contratos
PJ com franquia mensal e fechamento em dia fixo (não é 1º ao último dia do mês).

## Stack e arquitetura

- **Next.js 16 (App Router)** — frontend e backend no mesmo projeto (Server
  Components para leitura, Server Actions para escrita). Simples de manter e
  de hospedar como um único serviço.
- **SQLite via Drizzle ORM + libSQL (`@libsql/client`)** — em desenvolvimento
  local usa um arquivo em disco (`data/app.db`); em produção pode apontar para
  um banco [Turso](https://turso.tech) (SQLite hospedado, com tier gratuito),
  o que permite rodar em plataformas sem disco persistente como o Netlify. É o
  mesmo driver dos dois lados — nada no código muda, só a variável de ambiente
  `TURSO_DATABASE_URL`.
- **Regras de negócio isoladas em `src/lib/`** (`period.ts`, `hours.ts`,
  `time.ts`, `queries.ts`) — cálculo de período, saldo e duração nunca ficam
  só no frontend; toda mutação passa pelas Server Actions em `src/app/actions/`,
  que validam com `zod` antes de gravar.
- Horas são sempre armazenadas em **minutos** (inteiro). A conversão para
  `HhMM` é só na exibição (`formatMinutesShort`).

## Rodando localmente

```bash
npm install
npm run db:push   # cria o banco data/app.db a partir do schema
npm run seed      # cria o cliente/contrato inicial (15h, fechamento dia 10)
npm run dev        # http://localhost:3000
```

Para produção (self-host):

```bash
npm run build
npm run start
```

## Testes

```bash
npm run test:logic   # valida cálculo de duração, saldo, período e fechamento
```

## Hospedar de graça (Netlify + Turso)

O Netlify não guarda arquivos entre requisições, então o banco precisa morar
em outro lugar: o [Turso](https://turso.tech) é SQLite hospedado, com tier
gratuito bem folgado para este uso (5GB, centenas de milhões de leituras/mês).

1. Crie uma conta no [turso.tech](https://turso.tech) e um banco novo.
2. Pegue a **Database URL** e gere um **Auth Token** (no painel do Turso, ou
   via `turso db tokens create <nome-do-banco>` se instalar a CLI deles).
3. Aplique o schema nesse banco novo, a partir da sua máquina:
   ```bash
   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:push
   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run seed
   ```
4. Suba o projeto para um repositório Git (GitHub/GitLab) e conecte no
   Netlify ("Import an existing project").
5. Em **Site settings → Environment variables**, adicione `TURSO_DATABASE_URL`
   e `TURSO_AUTH_TOKEN` com os mesmos valores do passo 2.
6. Deploy. O Netlify detecta o Next.js automaticamente (plugin
   `@netlify/plugin-nextjs`, já listado em `netlify.toml`).

Sem essas variáveis configuradas, o app tenta usar um arquivo local — o que
não persiste no Netlify entre deploys, então não pule o passo 5.

### Alternativa com disco persistente de verdade

Se preferir não depender de um serviço externo de banco, dá para hospedar em
qualquer lugar com disco persistente (Railway, Render, um VPS, Fly.io com
volume) sem nenhuma das variáveis `TURSO_*` — o app volta a usar o arquivo
`data/app.db` local automaticamente. Nesse caso, faça backup periódico desse
arquivo.

## Estrutura para o futuro

O contrato já referencia um cliente (`clients` → `contracts`), então múltiplos
clientes/contratos é uma extensão do schema, não uma reescrita. Autenticação,
faturamento, exportação em PDF/Excel e envio por e-mail foram deixados de fora
do MVP de propósito, mas a separação entre `lib` (regras), `actions` (mutação)
e `app/*/page.tsx` (apresentação) foi pensada para acomodar isso depois.
