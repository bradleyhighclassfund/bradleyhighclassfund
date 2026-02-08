// app/portfolio/page.tsx

import { Suspense } from "react";
import { headers } from "next/headers";

type Position = {
  ticker: string;
  shares: number;
  price?: number;
  marketValue?: number;
  weight?: number;
};

function getBaseUrlFromHeaders() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  if (!host) {
    // Extremely rare, but prevents hard crash
    return "http://localhost:3000";
  }

  return `${proto}://${host}`;
}

async function getPortfolio(): Promise<Position[]> {
  const baseUrl = getBaseUrlFromHeaders();

  const res = await fetch(`${baseUrl}/api/portfolio`, {
    cache: "no-store",
  });

  if (!res.ok) {
    // Surface something helpful in logs
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch portfolio: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.positions ?? [];
}

async function PortfolioTable() {
  const positions = await getPortfolio();

  const totalValue = positions.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Portfolio</h1>

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
          {positions.map((p) => (
            <tr key={p.ticker}>
              <td>{p.ticker}</td>
              <td align="right">{p.shares}</td>
              <td align="right">
                {typeof p.price === "number" ? `$${p.price.toFixed(2)}` : "—"}
              </td>
              <td align="right">
                {typeof p.marketValue === "number"
                  ? `$${p.marketValue.toLocaleString()}`
                  : "—"}
              </td>
              <td align="right">
                {typeof p.weight === "number" ? `${(p.weight * 100).toFixed(2)}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "1.5rem" }}>
        Total Market Value: ${totalValue.toLocaleString()}
      </h2>
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
