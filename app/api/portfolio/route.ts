import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Position = {
  ticker: string;
  name: string;
  shares: number;
  cost_basis: number | null; // total cost basis dollars
};

type HoldingRow = {
  ticker: string;
  name: string;
  shares: number;
  cost_basis: number | null;
  cost_basis_per_share: number | null;
  last_price: number | null;
  market_value: number | null;
  weight: number | null;
  unrealized_pl: number | null;
  unrealized_pl_pct: number | null;
};

async function fetchPrice(ticker: string, apiKey: string): Promise<number | null> {
  const url = `https://api.api-ninjas.com/v1/stockprice?ticker=${encodeURIComponent(ticker)}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const j: any = await res.json();
  return typeof j?.price === "number" ? j.price : null;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const positionsPath = path.join(process.cwd(), "data", "positions.json");
    const positions = JSON.parse(fs.readFileSync(positionsPath, "utf-8")) as Position[];

    const apiKey = process.env.API_NINJAS_KEY || null;

    // Fetch prices in parallel (faster than one-by-one)
    const tickers = positions.map((p) => p.ticker.toUpperCase());
    const prices: Record<string, number | null> = {};

    if (apiKey) {
      const CONCURRENCY = 8;
      let i = 0;

      async function worker() {
        while (i < tickers.length) {
          const t = tickers[i++];
          prices[t] = await fetchPrice(t, apiKey);
        }
      }

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
    } else {
      // No key: return rows with null prices instead of failing
      for (const t of tickers) prices[t] = null;
    }

    const rows: HoldingRow[] = positions.map((p) => {
      const t = p.ticker.toUpperCase();
      const last = prices[t];
      const mv = last == null ? null : last * p.shares;

      const cbps = p.cost_basis == null ? null : p.cost_basis / p.shares;

      const upl =
        mv == null || p.cost_basis == null ? null : mv - p.cost_basis;

      const uplPct =
        upl == null || p.cost_basis == null || p.cost_basis === 0
          ? null
          : upl / p.cost_basis;

      return {
        ticker: t,
        name: p.name,
        shares: p.shares,
        cost_basis: p.cost_basis,
        cost_basis_per_share: cbps,
        last_price: last,
        market_value: mv,
        weight: null,
        unrealized_pl: upl,
        unrealized_pl_pct: uplPct,
      };
    });

    const totalMV = rows.reduce((acc, r) => acc + (r.market_value ?? 0), 0);
    const rowsWithWeights = rows.map((r) => ({
      ...r,
      weight: r.market_value == null || totalMV === 0 ? null : r.market_value / totalMV,
    }));

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        total_market_value: totalMV,
        holdings: rowsWithWeights,
        note: apiKey ? null : "API_NINJAS_KEY not set; prices/market value will be blank.",
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
