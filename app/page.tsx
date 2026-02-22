"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [value, setValue] = useState<string>("—");
  const [dailyChange, setDailyChange] = useState<string>("—");
  const [spChange, setSpChange] = useState<string>("—");

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => res.json())
      .then((data) => {
        const v = data?.totalMarketValue;
        const d = data?.dailyChange;

        if (typeof v === "number") {
          setValue(
            v.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            })
          );
        }

        if (typeof d === "number") {
          const sign = d >= 0 ? "+" : "";
          setDailyChange(`${sign}${d.toFixed(2)}%`);
        }
      })
      .catch(() => {
        setValue("Unavailable");
        setDailyChange("—");
      });

    fetch("/api/sp500")     // safe placeholder endpoint if exists later
      .then((res) => res.json())
      .then((data) => {
        const c = data?.dailyChange;
        if (typeof c === "number") {
          const sign = c >= 0 ? "+" : "";
          setSpChange(`${sign}${c.toFixed(2)}%`);
        }
      })
      .catch(() => setSpChange("—"));
  }, []);

  return (
    <main className="homeShell">
      <section className="homeCard centered">
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
            <div className="kpiLabel">Daily Portfolio Change</div>
            <div className="kpiValue">{dailyChange}</div>
          </div>

          <div className="kpi">
            <div className="kpiLabel">S&amp;P 500 Daily Change</div>
            <div className="kpiValue kpiMuted">{spChange}</div>
          </div>
        </div>

        <div className="chartBox">
          <div className="chartHeader">Portfolio Value Over Time</div>
          <div className="chartPlaceholder">Chart will appear here.</div>
        </div>
      </section>
    </main>
  );
}
