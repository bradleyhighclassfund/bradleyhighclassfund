// app/portfolio/page.tsx

import { Suspense } from "react";

type Position = {
  ticker: string;
  shares: number;
  price?: number;
  marketValue?: number;
  weight?: number;
};

async function getPortfolio(): Promise<Position[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/portfolio`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch portfolio");
  }

  const data = await res.json();
  return data.positions ?? [];
}

async function PortfolioTable() {
  const positions = await getPortfolio();

  const totalValue = positions.reduce(
    (sum, p) => sum + (p.marketValue ?? 0),
    0
  );

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Portfolio</h1>

      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
      >
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
          {positions.map(p => (
            <tr key={p.ticker}>
              <td>{p.ticker}</td>
              <td align="right">{p.shares}</td>
              <td align="right">
                {typeof p.price === "number"
                  ? `$${p.price.toFixed(2)}`
                  : "—"}
              </td>
              <td align="right">
                {typeof p.marketValue === "number"
                  ? `$${p.marketValue.toLocaleString()}`
                  : "—"}
              </td>
              <td align="right">
                {typeof p.weight === "number"
                  ? `${(p.weight * 100).toFixed(2)}%`
                  : "—"}
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
