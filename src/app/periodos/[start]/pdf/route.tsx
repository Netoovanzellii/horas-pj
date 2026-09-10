import { renderToBuffer } from "@react-pdf/renderer";
import { getPeriodReportData } from "@/lib/periodReport";
import { PeriodReportPdf } from "@/components/report/PeriodReportPdf";
import { formatDateTimeBR } from "@/lib/time";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COMBINING_MARKS = /[̀-ͯ]/g;

function slug(v: string): string {
  return v
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

export async function GET(_req: Request, { params }: { params: Promise<{ start: string }> }) {
  const { start } = await params;
  const data = await getPeriodReportData(start);
  if (!data) return new Response("Período não encontrado", { status: 404 });

  const buffer = await renderToBuffer(
    <PeriodReportPdf data={data} generatedAt={formatDateTimeBR()} />
  );
  const filename = `fechamento-${start}-${slug(data.contract.client.name)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
