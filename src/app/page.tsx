"use client";

import { useCallback, useEffect, useState } from "react";
import type { Case } from "./api/cases/route";

const COLUMNS: { key: keyof Case; label: string }[] = [
  { key: "caseName", label: "Case Name" },
  { key: "caseNumber", label: "Case Number" },
  { key: "roomID", label: "Courtroom" },
  { key: "floorID", label: "Floor" },
  { key: "timeStart", label: "Hearing Time" },
  { key: "judgeName", label: "Judge" },
];

function formatTime(iso: string): string {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return iso || "—";
  let hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(cases: Case[]): void {
  const header = COLUMNS.map((c) => c.label);
  const rows = cases.map((c) =>
    COLUMNS.map((col) =>
      escapeCsv(col.key === "timeStart" ? formatTime(c.timeStart) : c[col.key]),
    ),
  );
  const csv = [header, ...rows].map((r) => r.join(",")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "greene-county-tenant-cases.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cases");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      setCases(data.cases ?? []);
    } catch (err) {
      setError((err as Error).message);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Greene County Tenant Case Tracker
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Tenant cases (case numbers starting with 2631-AC03 or 2631-AC04)
            from today&apos;s Greene County, MO docket.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={() => downloadCsv(cases)}
            disabled={loading || cases.length === 0}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Export to CSV
          </button>
        </div>
      </header>

      {!loading && !error && cases.length > 0 && (
        <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
          {cases.length} {cases.length === 1 ? "case" : "cases"} found.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-neutral-200 py-16 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          Loading cases…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <p className="font-medium text-red-700 dark:text-red-400">
            Could not load cases
          </p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400/80">
            {error}
          </p>
          <button
            onClick={load}
            className="mt-4 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            Retry
          </button>
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 py-16 text-center text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          No tenant cases found for today&apos;s docket.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((c, i) => (
                <tr
                  key={`${c.caseNumber}-${i}`}
                  className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-3">
                    {c.caseName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs underline">
                    <a target="_blank" href={`https://www.courts.mo.gov/casenet/cases/newHeader.do?inputVO.courtId=CT31&inputVO.caseNumber=${c.caseNumber}`}>
                      {c.caseNumber}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {c.floorID}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {c.roomID}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatTime(c.timeStart)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {c.judgeName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="mt-6 text-xs text-neutral-400 dark:text-neutral-600">
        Data source: infax.com Greene County (MO) docket feed.
      </footer>
    </main>
  );
}
