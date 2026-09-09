import { db } from "../src/db/client";
import { requests, timeEntries, periodClosures } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { getActiveContract, getPeriodSummary, getRequestTotalMinutes, closePeriod, isPeriodClosed } from "../src/lib/queries";
import { getCurrentPeriod, getPreviousPeriod, formatPeriodLabel } from "../src/lib/period";
import { calcDurationMinutes, formatMinutesShort } from "../src/lib/time";
import { generateNextRequestNumber } from "../src/lib/requestNumber";
import { calcBalance } from "../src/lib/hours";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FALHOU:", msg);
    process.exitCode = 1;
  } else {
    console.log("OK:", msg);
  }
}

async function main() {
  const contract = await getActiveContract();
  if (!contract) throw new Error("Nenhum contrato ativo — rode o seed antes.");

  console.log("Contrato:", contract.client.name, "-", formatMinutesShort(contract.hoursPerPeriodMinutes), "dia fechamento", contract.closingDay);

  // --- Teste 1: cálculo de duração hora inicial/final ---
  const d1 = calcDurationMinutes("09:20", "10:00");
  assert(d1 === 40, `duração 09:20-10:00 deve ser 40min (obtido ${d1})`);
  const d2 = calcDurationMinutes("14:00", "15:20");
  assert(d2 === 80, `duração 14:00-15:20 deve ser 80min / 1h20 (obtido ${d2})`);

  let errorCaught = false;
  try {
    calcDurationMinutes("10:00", "09:00");
  } catch {
    errorCaught = true;
  }
  assert(errorCaught, "hora final antes da inicial deve lançar erro");

  // --- Teste 2: geração de número sequencial ---
  const testYear = 2099; // ano fictício para não colidir com dados reais
  const num1 = await generateNextRequestNumber(testYear);
  assert(num1 === `#${testYear}-001`, `primeiro número do ano ${testYear} deve ser 001 (obtido ${num1})`);

  // --- Teste 3: criar solicitação de teste + apontamentos (cenário exemplo do enunciado) ---
  const period = getCurrentPeriod(contract.closingDay);
  const midDate = period.start; // usa a data de início do período atual (dentro do período)

  const [req] = await db
    .insert(requests)
    .values({
      contractId: contract.id,
      number: num1,
      title: "[TESTE] Ajustar relatório de vendas",
      requester: "Fulano de Tal",
      openedAt: midDate,
      status: "Em andamento",
      priority: "Média",
    })
    .returning({ id: requests.id });

  await db.insert(timeEntries).values([
    { requestId: req.id, date: midDate, startTime: "09:20", endTime: "10:00", durationMinutes: 40, activityType: "Análise" },
    { requestId: req.id, date: midDate, startTime: "14:00", endTime: "15:20", durationMinutes: 80, activityType: "Desenvolvimento" },
    { requestId: req.id, date: midDate, durationMinutes: 30, activityType: "Teste", startTime: null, endTime: null },
  ]);

  const total = await getRequestTotalMinutes(req.id);
  assert(total === 150, `total da solicitação de teste deve ser 150min / 2h30 (obtido ${total} = ${formatMinutesShort(total)})`);

  // --- Teste 4: apontamento direto sem horário (duração informada) ---
  const requestEntries = await db.select().from(timeEntries).where(eq(timeEntries.requestId, req.id));
  const directEntry = requestEntries.find((e) => e.startTime === null);
  assert(!!directEntry && directEntry.durationMinutes === 30, "apontamento com duração direta (sem horário) deve valer 30min");

  // --- Teste 5: saldo abaixo da franquia (15h contratadas, 8h35 utilizadas → 6h25 disponíveis) ---
  const belowBalance = calcBalance(900, 515); // 15h vs 8h35
  assert(belowBalance.availableMinutes === 385, `cenário abaixo: saldo deve ser 385min / 6h25 (obtido ${formatMinutesShort(belowBalance.availableMinutes)})`);
  assert(belowBalance.overageMinutes === 0, "cenário abaixo: não deve haver excedente");

  // --- Teste 6: saldo acima da franquia (15h contratadas, 17h30 utilizadas → 0 disponível, 2h30 excedente) ---
  const aboveBalance = calcBalance(900, 1050); // 15h vs 17h30
  assert(aboveBalance.availableMinutes === 0, "cenário acima: disponível deve ser 0");
  assert(aboveBalance.overageMinutes === 150, `cenário acima: excedente deve ser 150min / 2h30 (obtido ${formatMinutesShort(aboveBalance.overageMinutes)})`);

  // --- Teste 7: resumo do período atual reflete os apontamentos de teste ---
  const summary = await getPeriodSummary(contract, period);
  assert(summary.balance.usedMinutes >= 150, `resumo do período deve contabilizar ao menos os 150min de teste (obtido ${summary.balance.usedMinutes})`);
  assert(summary.requests.some((r) => r.id === req.id), "solicitação de teste deve aparecer no resumo do período");

  // --- Teste 8: fechamento de período (dia 10) ---
  const prevPeriod = getPreviousPeriod(period, contract.closingDay);
  assert(!(await isPeriodClosed(contract.id, prevPeriod)), "período anterior deve começar aberto (sem fechamento registrado)");
  await closePeriod(contract.id, prevPeriod);
  assert(await isPeriodClosed(contract.id, prevPeriod), `período anterior (${formatPeriodLabel(prevPeriod)}) deve ficar fechado após closePeriod`);

  // --- limpeza dos dados de teste, para entregar o sistema limpo ---
  await db.delete(timeEntries).where(eq(timeEntries.requestId, req.id));
  await db.delete(requests).where(eq(requests.id, req.id));
  await db.delete(periodClosures).where(eq(periodClosures.contractId, contract.id));

  console.log("\nLimpeza concluída — dados de teste removidos.");
  console.log(process.exitCode ? "\nALGUM TESTE FALHOU." : "\nTODOS OS TESTES PASSARAM.");
}

main();
