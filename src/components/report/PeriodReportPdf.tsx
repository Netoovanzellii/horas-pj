import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatMinutesShort } from "@/lib/time";
import type { PeriodReportData } from "@/lib/periodReport";

// ---------------------------------------------------------------------------
// Helpers de formatação (versões "seguras" para as fontes core do PDF —
// sem setas unicode nem espaços especiais).
// ---------------------------------------------------------------------------
const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function monthLabel(startISO: string): string {
  const [y, m] = startISO.split("-").map(Number);
  return `Período de ${MESES[m - 1]} de ${y}`;
}

function datePt(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function brl(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  return (cents / 100)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/ /g, " ");
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const BLUE = "#2a78d6";
const BLUE_STRONG = "#184f95";
const INK = "#1a1a1a";
const MUTED = "#6b6b6b";
const HAIR = "#dcdcdc";
const RULE = "#333333";

const s = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 40,
    paddingHorizontal: 38,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: INK,
    lineHeight: 1.45,
  },

  // Cabeçalho
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  kicker: { fontSize: 7.5, letterSpacing: 0.5, color: BLUE_STRONG, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 17, fontFamily: "Helvetica-Bold", marginTop: 3 },
  clientBox: { textAlign: "right", maxWidth: 240 },
  clientName: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  clientLine: { fontSize: 8.5, color: MUTED },
  headerRule: { borderBottomWidth: 1.5, borderBottomColor: BLUE, marginTop: 8 },
  generated: { fontSize: 8, color: MUTED, marginTop: 4 },

  // Seções
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    color: "#444",
    marginBottom: 6,
  },

  // Resumo (chave/valor em 4 colunas)
  kvRow: { flexDirection: "row", marginBottom: 3 },
  kvLabel: { width: "20%", color: MUTED, paddingRight: 6 },
  kvValue: { width: "30%", paddingRight: 10 },
  kvValueStrong: { width: "30%", paddingRight: 10, fontFamily: "Helvetica-Bold" },

  // Tabelas
  tHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    paddingBottom: 3,
  },
  tHeadCell: { fontSize: 7.5, color: MUTED, fontFamily: "Helvetica-Bold" },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: HAIR,
    paddingVertical: 3,
  },
  tFoot: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: RULE,
    paddingTop: 4,
    marginTop: 1,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  right: { textAlign: "right" },
  blueStrong: { color: BLUE_STRONG, fontFamily: "Helvetica-Bold" },

  // Detalhamento
  groupHeading: { marginTop: 12, marginBottom: 3 },
  groupNumber: { color: MUTED },

  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: RULE,
    paddingTop: 5,
    marginTop: 6,
  },

  footer: {
    marginTop: 20,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: HAIR,
    fontSize: 7.5,
    color: MUTED,
  },
});

// Larguras das colunas
const SOL = ["11%", "30%", "15%", "12%", "12%", "12%", "8%"] as const;
const DET = ["13%", "15%", "16%", "44%", "12%"] as const;

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------
export function PeriodReportPdf({ data, generatedAt }: { data: PeriodReportData; generatedAt: string }) {
  const { contract, period, summary, requests, groups, totalMinutes } = data;
  const b = summary.balance;
  const overage = b.overageMinutes > 0;

  const monthlyValue = brl(contract.monthlyValueCents);
  const overtimeRate = brl(contract.overtimeHourValueCents);
  const overageCostCents =
    overage && contract.overtimeHourValueCents != null
      ? Math.round((b.overageMinutes / 60) * contract.overtimeHourValueCents)
      : null;
  const overageCost = brl(overageCostCents);

  const periodRange = `${datePt(period.start)} a ${datePt(period.end)}`;

  return (
    <Document
      title={`Fechamento ${monthLabel(period.start)} - ${contract.client.name}`}
      author="Controle de Horas"
    >
      <Page size="A4" style={s.page}>
        {/* Cabeçalho */}
        <View>
          <View style={s.headerRow}>
            <View>
              <Text style={s.kicker}>RELATÓRIO DE FECHAMENTO DE PERÍODO</Text>
              <Text style={s.title}>{monthLabel(period.start)}</Text>
            </View>
            <View style={s.clientBox}>
              <Text style={s.clientName}>{contract.client.name}</Text>
              {contract.client.cnpj ? <Text style={s.clientLine}>CNPJ {contract.client.cnpj}</Text> : null}
              {contract.client.email ? <Text style={s.clientLine}>{contract.client.email}</Text> : null}
            </View>
          </View>
          <View style={s.headerRule} />
          <Text style={s.generated}>
            Documento gerado em {generatedAt} · Status do fechamento: {summary.closed ? "Fechado" : "Aberto"}
          </Text>
        </View>

        {/* Resumo */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>RESUMO DO PERÍODO</Text>

          <View style={s.kvRow}>
            <Text style={s.kvLabel}>Período de apuração</Text>
            <Text style={s.kvValue}>{periodRange}</Text>
            <Text style={s.kvLabel}>Dia de fechamento</Text>
            <Text style={s.kvValue}>Dia {contract.closingDay}</Text>
          </View>
          <View style={s.kvRow}>
            <Text style={s.kvLabel}>Horas contratadas</Text>
            <Text style={s.kvValue}>{formatMinutesShort(b.contractedMinutes)}</Text>
            <Text style={s.kvLabel}>Horas utilizadas</Text>
            <Text style={s.kvValue}>{formatMinutesShort(b.usedMinutes)}</Text>
          </View>
          <View style={s.kvRow}>
            <Text style={s.kvLabel}>% da franquia utilizado</Text>
            <Text style={s.kvValue}>{b.percentUsed}%</Text>
          </View>
          {overageCost ? (
            <View style={s.kvRow}>
              <Text style={s.kvLabel}>Estimativa de excedente</Text>
              <Text style={[s.kvValue, { width: "80%", color: "#c0392b", fontFamily: "Helvetica-Bold" }]}>
                {formatMinutesShort(b.overageMinutes)} x {overtimeRate} = {overageCost}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Solicitações do período */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SOLICITAÇÕES DO PERÍODO ({requests.length})</Text>

          {requests.length === 0 ? (
            <Text style={{ color: MUTED }}>Nenhuma solicitação com apontamentos neste período.</Text>
          ) : (
            <>
              <View style={s.tHead}>
                <Text style={[s.tHeadCell, { width: SOL[0] }]}>Número</Text>
                <Text style={[s.tHeadCell, { width: SOL[1] }]}>Descrição</Text>
                <Text style={[s.tHeadCell, { width: SOL[2] }]}>Solicitante</Text>
                <Text style={[s.tHeadCell, { width: SOL[3] }]}>Abertura</Text>
                <Text style={[s.tHeadCell, { width: SOL[4] }]}>Conclusão</Text>
                <Text style={[s.tHeadCell, { width: SOL[5] }]}>Status</Text>
                <Text style={[s.tHeadCell, { width: SOL[6] }, s.right]}>Horas</Text>
              </View>
              {requests.map((r) => (
                <View key={r.id} style={s.tRow} wrap={false}>
                  <Text style={[s.bold, { width: SOL[0] }]}>{r.number}</Text>
                  <Text style={{ width: SOL[1], paddingRight: 6 }}>{r.title}</Text>
                  <Text style={{ width: SOL[2], paddingRight: 6, color: MUTED }}>{r.requester || "—"}</Text>
                  <Text style={{ width: SOL[3] }}>{datePt(r.openedAt)}</Text>
                  <Text style={{ width: SOL[4] }}>{r.completedAt ? datePt(r.completedAt) : "—"}</Text>
                  <Text style={{ width: SOL[5], color: MUTED }}>{r.status}</Text>
                  <Text style={[{ width: SOL[6] }, s.right, s.bold]}>{formatMinutesShort(r.totalMinutes)}</Text>
                </View>
              ))}
              <View style={s.tFoot}>
                <Text style={[s.bold, { width: "92%" }]}>Total de horas no período</Text>
                <Text style={[{ width: "8%" }, s.right, s.blueStrong]}>{formatMinutesShort(totalMinutes)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Detalhamento */}
        {totalMinutes > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>DETALHAMENTO DOS APONTAMENTOS</Text>

            {groups.map(({ request, entries, subtotalMinutes }) => {
              if (entries.length === 0) return null;
              return (
                <View key={request.id} style={{ marginBottom: 4 }}>
                  <Text style={s.groupHeading}>
                    <Text style={s.groupNumber}>{request.number} </Text>
                    <Text style={s.bold}>{request.title}</Text>
                  </Text>

                  <View style={s.tHead}>
                    <Text style={[s.tHeadCell, { width: DET[0] }]}>Data</Text>
                    <Text style={[s.tHeadCell, { width: DET[1] }]}>Tipo</Text>
                    <Text style={[s.tHeadCell, { width: DET[2] }]}>Horário</Text>
                    <Text style={[s.tHeadCell, { width: DET[3] }]}>Descrição</Text>
                    <Text style={[s.tHeadCell, { width: DET[4] }, s.right]}>Duração</Text>
                  </View>
                  {entries.map((e) => (
                    <View key={e.id} style={s.tRow}>
                      <Text style={{ width: DET[0] }}>{datePt(e.date)}</Text>
                      <Text style={{ width: DET[1] }}>{e.activityType}</Text>
                      <Text style={{ width: DET[2], color: MUTED }}>
                        {e.startTime && e.endTime ? `${e.startTime} - ${e.endTime}` : "—"}
                      </Text>
                      <Text style={{ width: DET[3], paddingRight: 6, color: "#333" }}>{e.description || "—"}</Text>
                      <Text style={[{ width: DET[4] }, s.right, s.bold]}>{formatMinutesShort(e.durationMinutes)}</Text>
                    </View>
                  ))}
                  <View style={s.tFoot}>
                    <Text style={[s.bold, { width: "88%" }]}>Subtotal {request.number}</Text>
                    <Text style={[{ width: "12%" }, s.right, s.bold]}>{formatMinutesShort(subtotalMinutes)}</Text>
                  </View>
                </View>
              );
            })}

            <View style={s.grandTotal}>
              <Text style={s.bold}>Total geral de horas apontadas no período</Text>
              <Text style={s.blueStrong}>{formatMinutesShort(totalMinutes)}</Text>
            </View>
          </View>
        ) : null}

        {/* Rodapé */}
        <Text style={s.footer}>
          Franquia contratada: {formatMinutesShort(contract.hoursPerPeriodMinutes)} por período · fechamento no dia{" "}
          {contract.closingDay}
          {monthlyValue ? ` · valor mensal ${monthlyValue}` : ""}. Relatório gerado eletronicamente pelo sistema de
          Controle de Horas em {generatedAt}.
        </Text>
      </Page>
    </Document>
  );
}
