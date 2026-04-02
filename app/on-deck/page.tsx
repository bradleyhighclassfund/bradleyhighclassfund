"use client";

import { useEffect, useMemo, useState } from "react";

type Candidate = {
  ticker: string;
  name: string;
  currentPrice: number | null;
  oneYearPerformance: number | null;
  fiveYearPerformance: number | null;
};

type ApiResponse = {
  last_updated?: string;
  quote_source?: string;
  items?: Candidate[];
  error?: string;
};

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "" : "-"}${Math.abs(value).toFixed(2)}%`;
}

function formatPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function perfColor(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "#6b7280";
  return value >= 0 ? "#166534" : "#b91c1c";
}

export default function OnDeckPage() {
  const [items, setItems] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/on-deck", { cache: "no-store" });
        const data: ApiResponse = await res.json();

        if (!mounted) return;

        if (!res.ok) {
          setError(data?.error ?? "Failed to load on-deck candidates.");
          setItems([]);
          setLastUpdated(null);
          return;
        }

        setItems(Array.isArray(data?.items) ? data.items : []);
        setLastUpdated(data?.last_updated ?? null);
      } catch {
        if (!mounted) return;
        setError("Failed to load on-deck candidates.");
        setItems([]);
        setLastUpdated(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updatedText = useMemo(() => {
    if (!lastUpdated) return null;

    const dt = new Date(lastUpdated);
    if (Number.isNaN(dt.getTime())) return null;

    return dt.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastUpdated]);

  return (
    <main
      style={{
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "48px 24px 80px",
      }}
    >
      <section
        style={{
          textAlign: "center",
          marginBottom: "34px",
        }}
      >
        <h1
          style={{
            fontSize: "2.4rem",
            fontWeight: 700,
            margin: "0 0 10px",
            letterSpacing: "-0.02em",
            color: "#111827",
          }}
        >
          Selection Set
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "1.05rem",
            color: "#4b5563",
            lineHeight: 1.6,
          }}
        >
          Firm(s) to be selected April 4 and included in portfolio following week.
        </p>

        {updatedText && !loading && !error ? (
          <p
            style={{
              marginTop: "10px",
              fontSize: "0.92rem",
              color: "#6b7280",
            }}
          >
            Last updated: {updatedText}
          </p>
        ) : null}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 22px",
              borderBottom: "1px solid #e5e7eb",
              background: "#f8fafc",
              fontWeight: 700,
              color: "#111827",
              fontSize: "1rem",
            }}
          >
            Candidate Firms
          </div>

          {loading ? (
            <div
              style={{
                padding: "28px 22px",
                color: "#6b7280",
                fontSize: "1rem",
              }}
            >
              Loading selection set...
            </div>
          ) : error ? (
            <div
              style={{
                padding: "28px 22px",
                color: "#b91c1c",
                fontSize: "1rem",
              }}
            >
              {error}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "860px",
                }}
              >
                <thead>
                  <tr style={{ background: "#ffffff" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontSize: "0.92rem",
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Ticker
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontSize: "0.92rem",
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Firm Name
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "16px 22px",
                        fontSize: "0.92rem",
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Current Price
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "16px 22px",
                        fontSize: "0.92rem",
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      1-Year Performance
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "16px 22px",
                        fontSize: "0.92rem",
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      5-Year Performance
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.ticker}>
                      <td
                        style={{
                          padding: "18px 22px",
                          borderBottom: "1px solid #f1f5f9",
                          fontWeight: 700,
                          color: "#111827",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {item.ticker}
                      </td>

                      <td
                        style={{
                          padding: "18px 22px",
                          borderBottom: "1px solid #f1f5f9",
                          color: "#111827",
                        }}
                      >
                        {item.name}
                      </td>

                      <td
                        style={{
                          padding: "18px 22px",
                          borderBottom: "1px solid #f1f5f9",
                          textAlign: "right",
                          color: "#111827",
                          fontWeight: 600,
                        }}
                      >
                        {formatPrice(item.currentPrice)}
                      </td>

                      <td
                        style={{
                          padding: "18px 22px",
                          borderBottom: "1px solid #f1f5f9",
                          textAlign: "right",
                          color: perfColor(item.oneYearPerformance),
                          fontWeight: 600,
                        }}
                      >
                        {formatPercent(item.oneYearPerformance)}
                      </td>

                      <td
                        style={{
                          padding: "18px 22px",
                          borderBottom: "1px solid #f1f5f9",
                          textAlign: "right",
                          color: perfColor(item.fiveYearPerformance),
                          fontWeight: 600,
                        }}
                      >
                        {formatPercent(item.fiveYearPerformance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
