export const dynamic = "force-dynamic";

type HoldingRow = {
  ticker: string;
  name?: string;
  shares: number;
  last_price: number;
  market_value: number;
  weight: number;
  cost_basis?: number | null;
};

type PortfolioResponse = {
  last_updated: string;
  total_market_value: number;
  holdings: HoldingRow[];
  error?: string;
};

function money(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "N/A";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default async function PortfolioPage() {
  let data: PortfolioResponse | null = null;
  let errorText = "";

  try {
    // Use relative URL so it works on Vercel without env vars
    const res = await fetch("/api/portfolio", { cache: "no-store" });
    const text = await res.text();
    const parsed = JSON.parse(text) as PortfolioResponse;

    if (!res.ok) {
      errorText = `Failed to load portfolio (HTTP ${res.status}).`;
      if ((parsed as any)?.error) errorText += `\n${(parsed as any).error}`;
    } else {
      data = parsed;
    }
  } catch (e: any) {
    errorText = `Failed to load portfolio. ${e?.message ?? ""}`.trim();
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 44, margin: "12px 0 18px" }}>Portfolio</h1>

      {errorText ? (
        <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{errorText}</pre>
      ) : null}

      {data ? (
        <>
          <p style={{ marginTop: 8 }}>
            Last updated: <b>{data.last_updated}</b>
          </p>

          <p style={{ marginTop: 8 }}>
            Total market value: <b>{money(data.total_market_value)}</b>
          </p>

          <table
            cellPadding={10}
            style={{
              borderCollapse: "collapse",
              width: "100%",
              fontSize: 14,
              marginTop: 16,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #eee" }}>
                <th align="left">Ticker</th>
                <th align="left">Name</th>
                <th align="right">Shares</th>
                <th align="right">EOD Price</th>
                <th align="right">Market Value</th>
                <th align="right">Weight</th>
                <th align="right">Cost Basis</th>
              </tr>
            </thead>
            <tbody>
              {(data.holdings ?? []).map((r) => (
                <tr key={r.ticker} style={{ borderTop: "1px solid #eee" }}>
                  <td>{r.ticker}</td>
                  <td>{r.name ?? ""}</td>
                  <td align="right">{r.shares}</td>
                  <td align="right">{Number(r.last_price).toFixed(2)}</td>
                  <td align="right">{money(r.market_value)}</td>
                  <td align="right">{(r.weight * 100).toFixed(2)}%</td>
                  <td align="right">{r.cost_basis == null ? "N/A" : money(r.cost_basis)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ marginTop: 16, fontSize: 12, color: "#444" }}>
            Prices shown are end-of-day prices taken from your broker export (not live quotes).
          </p>
        </>
      ) : null}
    </main>
  );
}
