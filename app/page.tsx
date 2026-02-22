"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [value, setValue] = useState<string>("—");

  useEffect(() => {
    fetch("/api/portfolio")
      .then(res => res.json())
      .then(data => {
        if (data?.totalMarketValue) {
          setValue(
            data.totalMarketValue.toLocaleString("en-US", {
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
    <div className="home-container">
      <div className="hero">
        <h1>Bradley High Class Fund</h1>

        <p className="tagline">
          An experiential student-selected investment portfolio focused on long-term capital appreciation.
        </p>

        <div className="value-card">
          <div className="label">Portfolio Value</div>
          <div className="value">{value}</div>
        </div>

        <div className="nav-links">
          <a href="/about">About</a>
          <a href="/portfolio">Portfolio</a>
          <a href="/methodology">Method</a>
        </div>
      </div>

      <div className="chart-placeholder">
        Portfolio value growth chart will appear here.
      </div>
    </div>
  );
}
