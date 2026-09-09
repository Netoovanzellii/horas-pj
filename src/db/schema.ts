import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// CLIENTE
// ---------------------------------------------------------------------------
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// ---------------------------------------------------------------------------
// CONTRATO (configuração da franquia / fechamento)
// ---------------------------------------------------------------------------
export const contracts = sqliteTable("contracts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  // Franquia mensal de horas, armazenada em MINUTOS.
  hoursPerPeriodMinutes: integer("hours_per_period_minutes").notNull().default(900), // 15h
  // Dia do mês em que ocorre o fechamento (ex.: 10)
  closingDay: integer("closing_day").notNull().default(10),
  // Valores monetários armazenados em CENTAVOS (evita ponto flutuante). Opcionais para o MVP.
  monthlyValueCents: integer("monthly_value_cents"),
  overtimeHourValueCents: integer("overtime_hour_value_cents"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  status: text("status", { enum: ["ativo", "encerrado"] })
    .notNull()
    .default("ativo"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// ---------------------------------------------------------------------------
// SOLICITAÇÃO
// ---------------------------------------------------------------------------
export const REQUEST_STATUSES = [
  "Aberta",
  "Em análise",
  "Em andamento",
  "Aguardando retorno",
  "Concluída",
  "Cancelada",
] as const;

export const REQUEST_PRIORITIES = ["Baixa", "Média", "Alta", "Urgente"] as const;

export const requests = sqliteTable("requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractId: integer("contract_id")
    .notNull()
    .references(() => contracts.id),
  number: text("number").notNull().unique(), // ex: #2026-034
  title: text("title").notNull(),
  description: text("description"),
  requester: text("requester"),
  openedAt: text("opened_at").notNull(),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  status: text("status", { enum: REQUEST_STATUSES }).notNull().default("Aberta"),
  priority: text("priority", { enum: REQUEST_PRIORITIES }).notNull().default("Média"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// ---------------------------------------------------------------------------
// APONTAMENTO DE HORAS
// ---------------------------------------------------------------------------
export const ACTIVITY_TYPES = [
  "Análise",
  "Desenvolvimento",
  "Suporte",
  "Reunião",
  "Implantação",
  "Teste",
  "Documentação",
  "Outros",
] as const;

export const timeEntries = sqliteTable("time_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestId: integer("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time"), // HH:MM, opcional se durationMinutes for informado direto
  endTime: text("end_time"), // HH:MM
  durationMinutes: integer("duration_minutes").notNull(), // sempre calculado/armazenado em minutos
  activityType: text("activity_type", { enum: ACTIVITY_TYPES }).notNull().default("Outros"),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// ---------------------------------------------------------------------------
// FECHAMENTO DE PERÍODO
// Os totais de um período são sempre CALCULADOS a partir dos apontamentos
// (evita duplicação de dados). Esta tabela guarda apenas o registro de que
// um período foi fechado formalmente (status Aberto/Fechado).
// ---------------------------------------------------------------------------
export const periodClosures = sqliteTable("period_closures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractId: integer("contract_id")
    .notNull()
    .references(() => contracts.id),
  periodStart: text("period_start").notNull(), // YYYY-MM-DD
  periodEnd: text("period_end").notNull(), // YYYY-MM-DD
  closedAt: text("closed_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});
