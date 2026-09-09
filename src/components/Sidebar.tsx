"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/solicitacoes", label: "Solicitações" },
  { href: "/periodos", label: "Períodos" },
  { href: "/configuracoes", label: "Configurações" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Top bar mobile */}
      <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border-hairline)] bg-[var(--surface-1)] sticky top-0 z-30">
        <span className="font-semibold text-[15px]">Controle de Horas</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 -mr-2 text-[var(--text-secondary)]"
          aria-label="Abrir menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="sm:hidden bg-[var(--surface-1)] border-b border-[var(--border-hairline)] px-2 py-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-[14px] ${
                isActive(l.href)
                  ? "bg-[var(--series-1-wash)] text-[var(--series-1-strong)] font-medium"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden sm:flex sm:flex-col w-60 shrink-0 border-r border-[var(--border-hairline)] bg-[var(--surface-1)] min-h-screen sticky top-0">
        <div className="px-5 py-6">
          <div className="font-semibold text-[15px] leading-tight">Controle de Horas</div>
          <div className="text-[12px] text-[var(--text-muted)] mt-0.5">Prestação de serviços PJ</div>
        </div>
        <nav className="px-3 flex flex-col gap-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-md text-[14px] transition-colors ${
                isActive(l.href)
                  ? "bg-[var(--series-1-wash)] text-[var(--series-1-strong)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
