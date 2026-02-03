import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = {
  ticker: string;
  name: string;
  shares: number;
  cost_basis: number;
};

async function fetchPrice(ticker: string, apiKey: string): Promise<number | null> {
  try {
    const url = `https://api.api-ninjas.com/v1/stockprice?ticker=${encodeURIComponent(
      ticker
    )}`;

    const res = await fetch(url, {
      headers: {
        "X-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json();
    return typeof json.price === "number" ? json.price : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const apiKey = process.env.API_NINJAS_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API_NINJAS_KEY" },
        { status: 500 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "data",
      "Individual-Positions-2026-02-02-205634.csv"
    );

    const raw = fs.readFileSync(filePath, "utf8");
    const lines = raw.trim().split("\n");

    const holdings: Holding[] = lines.slice(1).map((line) => {
      const [ticker, name, shares, cost_basis] = line.split(",");

      return {
        ticker: ticker.trim(),
        name: name.trim(),
        shares: Number(shares),
        cost_basis: Number(cost_basis),
      };
    });

    const prices: Record<string, number | null> = {};

    // ---- controlled concurrency ----
    const CONCURRENCY = 6;
    let i = 0;

    async function worker() {
      while (i < holdings.length) {
        const h = holdings[i++];
        prices[h.ticker] = await fetchPrice(h.ticker, apiKey);
      }
    }

    await Promise.all(
      Array.from({ length: CONCURRENCY }, () => worker())
    );

    const enriched = holdings.map((h) => {
      const price = prices[h.ticker];
      const market_value = price ? price * h.shares : 0;

      return {
        ticker: h.ticker,
        name: h.name,
        shares: h.shares,
        cost_basis: h.cost_basis,
        last_price: price,
        market_value,
      };
    });

    const total_market_value = enriched.reduce(
      (sum, h) => sum + h.market_value,
      0
    );

    return NextResponse.json({
      last_updated: new Date().toISOString(),
      total_market_value,
      holdings: enriched,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
