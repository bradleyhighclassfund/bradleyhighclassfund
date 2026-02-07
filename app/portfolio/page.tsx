"use client";

import React, { useEffect, useMemo, useState } from "react";

type Holding = {
  ticker: string;
  name?: string;
  shares: number;
  last_price?: number;
  market_value?: number;
  weight?: number;
  cost_basis?: number;
};

type PortfolioResponse = {
  last_updated?: string;
  quote_as_of?: string;
  total_market_value?: number;
  holdings?: Holding[];
  error?: string;
};

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErrMsg(null);

        const res = await fetch("/api/portfolio", { cache: "no-store" });

        // Try to read JSON even on errors (your API returns { error: ... })
        let payload: any = null;
        try {
          payload = await res.json();
        } catch {
          // If it isn't JSON, fall back to text
          const txt = await res.text();
          payload = { error: txt || `HTTP ${res.status}` };
        }

        if (!res.ok) {
          const apiErr =
            typeof payload?.error === "string"
              ? payload.error
              : `HTTP ${res.status}`;
          throw new Error(apiErr);
        }

        if (!cancelled) {
          setData(payload as PortfolioResponse);
        }
      } catch (e: any) {
        if (!cancelled) {
          setData(null);
          setErrMsg(e?.message ? String(e.message) : "Failed to load portfolio.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const holdings: Holding[] = useMemo(() => {
    const h = data?.holdings;
    return Array.isArray(h) ? h : [];
  }, [data]);

  const lastUpdated = data?.last_updated || data?.quote_as_of || "";

  const totalMarketValue = useMemo(() => {
    if (typeof data?.total_market_value === "number") return data.total_market_value;
    // fallback: sum
    return holdings.reduce((sum, x) => sum + (Number(x.market_value) || 0), 0);
  }, [data, holdings]);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 48, fontWeight: 700, margin: 0 }}>Portfolio</h1>

      {loading && <p style={{ marginTop: 16 }}>Loading…</p>}

      {!loading && errMsg && (
        <div style={{ marginTop: 16, color: "crimson" }}>
          <div style={{ fontWeight: 600 }}>Failed to load portfolio.</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{errMsg}</pre>
        </div>
      )}

      {!loading && !errMsg && (
        <>
          <div style={{ marginTop: 16 }}>
            <div>
              Last updated:{" "}
              <b>{lastUpdated ? lastUpdated : "—"}</b>
            </div>
            <div style={{ marginTop: 8 }}>
              Total market value: <b>{formatMoney(totalMarketValue)}</b>
            </div>
          </div>

          <div style={{ marginTop: 24, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                  <th style={th}>Ticker</th>
                  <th style={th}>Name</th>
                  <th style={thRight}>Shares</th>
                  <th style={thRight}>Last Price</th>
                  <th style={thRight}>Market Value</th>
                  <th style={thRight}>Weight</th>
                  <th style={thRight}>Cost Basis</th>
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 12 }}>
                      No holdings found.
                    </td>
                  </tr>
                ) : (
                  holdings.map((h, idx) => (
                    <tr key={`${h.ticker}-${idx}`} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={td}>{h.ticker}</td>
                      <td style={td}>{h.name ?? ""}</td>
                      <td style={tdRight}>{formatNumber(h.shares)}</td>
                      <td style={tdRight}>{formatMoney(h.last_price ?? 0)}</td>
                      <td style={tdRight}>{formatMoney(h.market_value ?? 0)}</td>
                      <td style={tdRight}>{formatPct(h.weight)}</td>
                      <td style={tdRight}>{formatMoney(h.cost_basis ?? 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

const th: React.CSSProperties = { padding: 10, fontWeight: 700 };
const thRight: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: 10 };
const tdRight: React.CSSProperties = { ...td, textAlign: "right" };

function formatMoney(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatNumber(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString();
}

function formatPct(p?: number) {
  const v = typeof p === "number" && Number.isFinite(p) ? p : 0;
  // assume weight is 0-1; if already 0-100 this will look off but still safe
  const asPct = v <= 1 ? v * 100 : v;
  return `${asPct.toFixed(2)}%`;
}
