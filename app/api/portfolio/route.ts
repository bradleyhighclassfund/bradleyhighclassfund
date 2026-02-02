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
  // Always prefer a relative URL for internal API routes.
  // This avoids needing NEXT_PUBLIC_BASE_URL and prevents localhost/wrong-domain issues on Vercel.
  const res = await fetch("/api/portfolio", { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Portfolio</h1>
        <p style={{ color: "crimson" }}>
          Failed to load portfolio data (HTTP {res.status}).
        </p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f7f7f7", padding: 12, borderRadius: 8 }}>
          {text.slice(0, 2000)}
        </pre>
      </main>
    );
  }

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
              <td align="right">{r.last_price == null ? "—" : r.last_price.toFixed(2)}</td>
              <td align="right">{r.market_value == null ? "—" : Math.round(r.market_value).toLocaleString()}</td>
              <td align="right">{r.weight == null ? "—" : `${(r.weight * 100).toFixed(2)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
