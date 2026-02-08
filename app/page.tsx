import { Suspense } from "react";
import { headers } from "next/headers";

type Row = {
  ticker: string;
  shares: number;
  last_price: number | null;
  market_value: number | null;
  weight: number | null;
};

type ApiPayload = {
  last_updated: string | null;
  quote_as_of: string | null;
  total_market_value: number;
  holdings: Row[];
  missing?: string[];
  error?: string;
  note?: string;
};

function getBaseUrlFromHeaders() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

async function getPortfolio(): Promise<ApiPayload> {
  const baseUrl = getBaseUrlFromHeaders();
  const res = await fetch(`${baseUrl}/api/portfolio`, { cache: "no-store" });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`GET /api/portfolio failed: ${res.status} ${text.slice(0, 300)}`);
  }

  return JSON.parse(text);
}

function money(x: number) {
  return x.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

async function PortfolioTable() {
  const data = await getPortfolio();

  const rows = data.holdings ?? [];
  const total = data.total_market_value ?? 0;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Portfolio</h1>

      {data.error ? (
        <div style={{ marginTop: 12, color: "crimson" }}>{data.error}</div>
      ) : null}

      {data.note ? (
        <div style={{ marginTop: 12, color: "#666" }}>{data.note}</div>
      ) : null}

      {data.missing?.length ? (
        <div style={{ marginTop: 12, color: "#666", fontSize: 12 }}>
          Missing quotes: {data.missing.join(", ")}
        </div>
      ) : null}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th align="left">Ticker</th>
            <th align="right">Shares</th>
            <th align="right">Price</th>
            <th align="right">Market Value</th>
            <th align="right">Weight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ticker}>
              <td>{r.ticker}</td>
              <td align="right">{r.shares}</td>
              <td align="right">{r.last_price === null ? "—" : money(r.last_price)}</td>
              <td align="right">{r.market_value === null ? "—" : money(r.market_value)}</td>
              <td align="right">
                {r.weight === null ? "—" : `${(r.weight * 100).toFixed(2)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "1.5rem" }}>Total Market Value: {money(total)}</h2>

      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        Last updated: {data.last_updated ?? "—"}{" "}
        {data.quote_as_of ? `| Quote as of: ${data.quote_as_of}` : ""}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading portfolio…</div>}>
      <PortfolioTable />
    </Suspense>
  );
}
