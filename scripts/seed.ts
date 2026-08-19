import { db } from "../src/db/client";
import { clients, contracts } from "../src/db/schema";

async function main() {
  const existing = await db.select().from(clients);
  if (existing.length > 0) {
    console.log("Já existem dados. Seed ignorado.");
    return;
  }

  const [client] = await db
    .insert(clients)
    .values({
      name: "Nome do Cliente / Razão Social",
      cnpj: null,
      email: null,
      phone: null,
      notes: null,
    })
    .returning({ id: clients.id });

  await db.insert(contracts).values({
    clientId: client.id,
    hoursPerPeriodMinutes: 900, // 15h
    closingDay: 10,
    monthlyValueCents: null,
    overtimeHourValueCents: null,
    startDate: "2026-08-10",
    endDate: null,
    status: "ativo",
  });

  console.log("Seed criado: cliente + contrato (15h, fechamento dia 10).");
}

main();
