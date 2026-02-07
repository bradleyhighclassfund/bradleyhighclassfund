"use client";

import { useEffect, useMemo, useState } from "react";

type HoldingRow = {
  ticker: string;
  name?: string | null;
  shares: number;
  cost_basis?: number | null; // total cost basis dollars (not per share)
  last_price?: number | null; // EOD close
  market_value?: number | null;
  weight?: number | null;
};

type PortfolioSnapshot = {
  last_updated: string | null;
  quote_as_of: string | null;
  total_market_value: number;
  holdings: HoldingRow[];
};

function fmtUsd(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function fmtNum(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtPct(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/portfolio", { cache: "no-store" });
        const text = await res.text();

        if (!res.ok) {
          // Try to display JSON error if possible
          try {
            const j = JSON.parse(text);
            throw new Error(j?.error || `HTTP ${res.status}`);
          } catch {
            throw new Error(text || `HTTP ${res.status}`);
          }
        }

        const j = JSON.parse(text) as PortfolioSnapshot;
        if (alive) setData(j);
      } catch (e: any) {
        if (alive) setErr(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => data?.holdings ?? [], [data]);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 48, fontWeight: 700, margin: 0 }}>Portfolio</h1>

      {loading && <p style={{ marginTop: 16 }}>Loading…</p>}

      {err && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "crimson", fontWeight: 700 }}>Failed to load portfolio.</div>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{err}</pre>
        </div>
      )}

      {!loading && !err && data && (
        <>
          <div style={{ marginTop: 20, lineHeight: 1.7 }}>
            <div>
              <strong>Last updated:</strong>{" "}
              {data.last_updated ? new Date(data.last_updated).toISOString() : "—"}
            </div>
            <div>
              <strong>Prices as of (EOD close):</strong>{" "}
              {data.quote_as_of ? new Date(data.quote_as_of).toISOString() : "—"}
            </div>
            <div style={{ marginTop: 10 }}>
              <strong>Total market value:</strong> {fmtUsd(data.total_market_value)}
            </div>
          </div>

          <div style={{ marginTop: 22, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Ticker", "Name", "Shares", "Cost Basis", "Last Price (EOD)", "Market Value", "Weight"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 8px",
                          borderBottom: "2px solid #ddd",
                          fontSize: 14,
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.ticker}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>{r.ticker}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                      {r.name ?? "—"}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                      {fmtNum(r.shares, 0)}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                      {fmtUsd(r.cost_basis ?? null)}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                      {fmtUsd(r.last_price ?? null)}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                      {fmtUsd(r.market_value ?? null)}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                      {fmtPct(r.weight ?? null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
