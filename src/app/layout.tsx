import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getAllContractsWithClients, getActiveContract } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Controle de Horas PJ",
  description: "Controle de solicitações e apontamento de horas para prestação de serviços PJ",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [allContracts, active] = await Promise.all([getAllContractsWithClients(), getActiveContract()]);
  const contractOptions = allContracts.map((c) => ({ id: c.id, clientName: c.client.name, status: c.status }));

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <div className="flex flex-col sm:flex-row min-h-screen">
          <Sidebar contractOptions={contractOptions} selectedContractId={active?.id ?? null} />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 max-w-6xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
