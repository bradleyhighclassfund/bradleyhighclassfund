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
    <main className="home-main">
      <h1>Bradley High Class Fund</h1>

      <p className="home-tagline">
        An experiential student-selected investment portfolio focused on long-term capital appreciation.
      </p>

      <div className="home-metrics-inline">
        <span className="label">Portfolio Value:</span>
        <span className="value">{value}</span>
      </div>

      <div className="home-chart">Portfolio value growth chart will appear here.</div>
    </main>
  );
}
