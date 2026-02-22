"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [value, setValue] = useState<string>("—");

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => res.json())
      .then((data) => {
        const v = data?.totalMarketValue;
        if (typeof v === "number" && Number.isFinite(v)) {
          setValue(
            v.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            })
          );
        }
      })
      .catch(() => setValue("Unavailable"));
  }, []);

  return (
    <main className="homeShell">
      <section className="homeCard">
        <div className="kicker">Student-Selected Portfolio</div>

        <h1 className="homeTitle">Bradley High Class Fund</h1>

        <p className="homeSubtitle">
          An experiential student-selected investment portfolio focused on long-term capital appreciation.
        </p>

        <div className="kpiRow">
          <div className="kpi">
            <div className="kpiLabel">Portfolio Value</div>
            <div className="kpiValue">{value}</div>
          </div>

          <div className="kpi">
            <div className="kpiLabel">Benchmark</div>
            <div className="kpiValue kpiMuted">S&amp;P 500 (placeholder)</div>
          </div>

          <div className="kpi">
            <div className="kpiLabel">Since</div>
            <div className="kpiValue kpiMuted">—</div>
          </div>
        </div>

        <div className="chartBox">
          <div className="chartHeader">Portfolio Value Over Time</div>
          <div className="chartPlaceholder">
            Chart will appear here.
            <div className="chartNote">
              (Next step: store portfolio value history and render a simple line chart.)
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
