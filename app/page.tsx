"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const [portfolioDailyChange, setPortfolioDailyChange] = useState<number | null>(null);
  const [sp500DailyChange, setSp500DailyChange] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/portfolio");
        const data = await res.json();

        setPortfolioValue(data.totalMarketValue ?? null);
        setPortfolioDailyChange(data.dailyChange ?? null);

        // If you have a separate S&P endpoint, adjust here.
        // Otherwise this assumes you are computing it elsewhere.
        if (data.sp500DailyChange !== undefined) {
          setSp500DailyChange(data.sp500DailyChange);
        }
      } catch (e) {
        console.error("Error fetching portfolio data:", e);
      }
    }

    fetchData();
  }, []);

  const formatCurrency = (val: number | null) =>
    val !== null ? `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—";

  const formatPercent = (val: number | null) =>
    val !== null ? `${val >= 0 ? "+" : ""}${val.toFixed(2)}%` : "—";

  const portfolioClass =
    portfolioDailyChange !== null
      ? portfolioDailyChange >= 0
        ? "pos"
        : "neg"
      : "";

  const spClass =
    sp500DailyChange !== null
      ? sp500DailyChange >= 0
        ? "pos"
        : "neg"
      : "";

  return (
    <main className="homeShell">
      <section className="homeCard centered">
        <h1 className="homeTitle">Bradley High Class Fund</h1>
        <p className="homeSubtitle">
          An experiential student-selected investment portfolio focused on long-term capital appreciation.
        </p>

        {/* KPI ROW */}
        <div className="kpiRow">
          <div className="kpi">
            <div className="kpiLabel">Portfolio Value</div>
            <div className="kpiValue">{formatCurrency(portfolioValue)}</div>
          </div>

          <div className="kpi">
            <div className="kpiLabel">Daily Portfolio Change</div>
            <div className={`kpiValue ${portfolioClass}`}>
              {formatPercent(portfolioDailyChange)}
            </div>
          </div>

          <div className="kpi">
            <div className="kpiLabel">S&amp;P 500 Daily Change</div>
            <div className={`kpiValue ${spClass}`}>
              {formatPercent(sp500DailyChange)}
            </div>
          </div>
        </div>

        {/* PERFORMANCE IMAGE */}
        <div className="chartBox">
          <div className="chartHeader">Portfolio Value Over Time</div>

          <img
            src="/performance.png"
            alt="Portfolio performance"
            className="performanceImage"
          />
        </div>
      </section>
    </main>
  );
}
