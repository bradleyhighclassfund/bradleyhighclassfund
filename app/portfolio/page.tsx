"use client";

import { useEffect, useState } from "react";

type Holding = {
  ticker: string;
  name?: string;
  shares: number;
  last_price: number;
  market_value: number;
  weight: number;
  cost_basis?: number;
};

type PortfolioResponse = {
  last_updated: string;
  total_market_value: number;
  holdings: Holding[];
};

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main style={{ padding: "24px" }}>
      <h1 style={{ fontSize: "48px", fontWeight: 700 }}>Portfolio</h1>

      {loading && <p>Loading…</p>}

      {error && (
        <p style={{ color: "red" }}>
          Failed to load portfolio. {error}
        </p>
      )}

      {data && (
        <>
          <p>
            <strong>Last updated:</strong>{" "}
            {new Date(data.last_updated).toISOString()}
          </p>

          <p>
            <strong>Total market value:</strong>{" "}
            {data.total_market_value.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </p>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "24px",
            }}
          >
            <thead>
              <tr>
                <th align="left">Ticker</th>
                <th align="right">Shares</th>
                <th align="right">Last Price</th>
                <th align="right">Market Value</th>
                <th align="right">Weight</th>
              </tr>
            </thead>
            <tbody>
              {data.holdings.map((h) => (
                <tr key={h.ticker}>
                  <td>{h.ticker}</td>
                  <td align="right">{h.shares}</td>
                  <td align="right">
                    {h.last_price.toFixed(2)}
                  </td>
                  <td align="right">
                    {h.market_value.toLocaleString(undefined, {
                      style: "currency",
                      currency: "USD",
                    })}
                  </td>
                  <td align="right">
                    {(h.weight * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
