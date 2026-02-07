"use client";

import { useEffect, useMemo, useState } from "react";

type Holding = {
  ticker: string;
  name?: string;
  shares: number;
  last_price?: number | null;
  market_value?: number | null;
  weight?: number | null;
  cost_basis?: number | null;
};

type PortfolioResponse = {
  last_updated: string;
  quote_as_of?: string;
  total_market_value: number;
  holdings: Holding[];
};

function fmtMoney(x: number | null | undefined) {
  const v = typeof x === "number" && Number.isFinite(x) ? x : 0;
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function fmtNum(x: number | null | undefined, digits = 2) {
  const v = typeof x === "number" && Number.isFinite(x) ? x : 0;
  return v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtPct(x: number | null | undefined) {
  const v = typeof x === "number" && Number.isFinite(x) ? x : 0;
  return `${(v * 100).toFixed(2)}%`;
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        // Browser fetch to same-origin API route
        const res = await fetch("/api/portfolio", { cache: "no-store" });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${txt}`);
        }

        const json = (await res.json()) as PortfolioResponse;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    if (!data?.holdings) return [];
    return [...data.holdings].sort((a, b) => (a.ticker || "").localeCompare(b.ticker || ""));
  }, [data]);

  return (
    <main style={{ padding: "24px" }}>
      <h1 style={{ fontSize: "48px", fontWeight: 700, warn: "none" as any }}>Portfolio</h1>

      {loading && <p style={{ marginTop: 16 }}>Loading…</p>}

      {!loading && err && (
        <div style={{ marginTop: 16, color: "crimson" }}>
          <div>Failed to load portfolio.</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{err}</pre>
        </div>
      )}

      {!loading && !err && data && (
        <>
          <div style={{ marginTop: 16 }}>
            <div>
              <strong>Last updated:</strong> {data.last_updated}
            </div>
            {data.quote_as_of ? (
              <div>
                <strong>Quote as of:</strong> {data.quote_as_of}
              </div>
            ) : null}
            <div style={{ marginTop: 8 }}>
              <strong>Total market value:</strong> {fmtMoney(data.total_market_value)}
            </div>
          </div>

          <div style={{ marginTop: 18, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Ticker</th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Name</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>Shares</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>Last Price</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>Market Value</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>Weight</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>Cost Basis</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.ticker} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px 8px" }}>{h.ticker}</td>
                    <td style={{ padding: "10px 8px" }}>{h.name ?? ""}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmtNum(h.shares, 0)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmtNum(h.last_price ?? 0, 2)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmtMoney(h.market_value ?? 0)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmtPct(h.weight ?? 0)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                      {h.cost_basis == null ? "" : fmtMoney(h.cost_basis)}
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
