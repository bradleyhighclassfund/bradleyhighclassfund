import { Suspense } from "react";
import { headers } from "next/headers";

type Row = {
  ticker: string;
  name: string;
  shares: number;
  costBasis: number | null;
  price: number | null;
  marketValue: number | null;
  weight: number | null;
};

type ApiPayload = {
  last_updated?: string;
  quote_source?: string;
  totalMarketValue: number;
  positions: Row[];
  missing?: string[];
  error?: string;
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
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

function money(x: number) {
  return x.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

async function PortfolioTable() {
  const data = await getPortfolio();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Portfolio</h1>

      {data.missing?.length ? (
        <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          Missing quotes: {data.missing.join(", ")}
        </div>
      ) : null}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th align="left">Ticker</th>
            <th align="left">Firm</th>
            <th align="right">Shares</th>
            <th align="right">Cost Basis</th>
            <th align="right">Price</th>
            <th align="right">Market Value</th>
            <th align="right">Weight</th>
          </tr>
        </thead>
        <tbody>
          {data.positions.map((p) => (
            <tr key={p.ticker}>
              <td>{p.ticker}</td>
              <td>{p.name || "—"}</td>
              <td align="right">{p.shares}</td>
              <td align="right">{p.costBasis === null ? "Incomplete" : money(p.costBasis)}</td>
              <td align="right">{p.price === null ? "—" : money(p.price)}</td>
              <td align="right">{p.marketValue === null ? "—" : money(p.marketValue)}</td>
              <td align="right">
                {p.weight === null ? "—" : `${(p.weight * 100).toFixed(2)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "1.5rem" }}>Total Market Value: {money(data.totalMarketValue)}</h2>

      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        Last updated: {data.last_updated ?? "—"}
        {data.quote_source ? ` | Source: ${data.quote_source}` : ""}
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
