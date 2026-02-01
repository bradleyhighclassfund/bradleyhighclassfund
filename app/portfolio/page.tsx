type PortfolioSnapshot = {
  last_updated: string | null;
  quote_as_of: string | null;
  total_market_value: number;
  holdings: Array<{
    ticker: string;
    shares: number;
    last_price: number | null;
    market_value: number | null;
    weight: number | null;
  }>;
};

export default async function PortfolioPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/portfolio`, { cache: "no-store" });
  const data = (await res.json()) as PortfolioSnapshot;

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Portfolio</h1>
      <p>
        Last updated: <b>{data.last_updated ?? "N/A"}</b> (delayed quotes)
      </p>

      <p>
        Total market value: <b>{Number(data.total_market_value || 0).toLocaleString()}</b>
      </p>

      <table cellPadding={10} style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #eee" }}>
            <th align="left">Ticker</th>
            <th align="right">Shares</th>
            <th align="right">Last Price</th>
            <th align="right">Market Value</th>
            <th align="right">Weight</th>
          </tr>
        </thead>
        <tbody>
          {(data.holdings ?? []).map((r) => (
            <tr key={r.ticker} style={{ borderTop: "1px solid #eee" }}>
              <td>{r.ticker}</td>
              <td align="right">{r.shares}</td>
              <td align="right">{r.last_price ?? "N/A"}</td>
              <td align="right">{r.market_value == null ? "N/A" : r.market_value.toLocaleString()}</td>
              <td align="right">{r.weight == null ? "N/A" : (r.weight * 100).toFixed(2) + "%"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 16, fontSize: 12, color: "#444" }}>
        Note: If a ticker shows N/A, the quote provider could not return a price for that symbol.
      </p>
    </main>
  );
}
