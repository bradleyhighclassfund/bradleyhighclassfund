import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RawHolding = {
  ticker: string;
  name?: string;
  shares: number;
  price?: number; // EOD price from your file
  market_value?: number; // optional; if missing we compute shares * price
  cost_basis?: number | null; // total cost basis
};

type ActiveHoldingsFile = {
  last_updated?: string;
  source?: string;
  holdings: RawHolding[];
};

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "active_holdings.json");
    const rawText = await fs.readFile(filePath, "utf-8");

    const parsed = JSON.parse(rawText) as ActiveHoldingsFile;
    const holdings = Array.isArray(parsed.holdings) ? parsed.holdings : [];

    const normalized = holdings
      .map((h) => {
        const ticker = (h.ticker ?? "").toString().trim().toUpperCase();
        const name = (h.name ?? "").toString().trim();
        const shares = num(h.shares, 0);

        const price = num(h.price, 0);

        const marketValue =
          h.market_value === undefined || h.market_value === null
            ? shares * price
            : num(h.market_value, shares * price);

        const costBasis = h.cost_basis === undefined ? null : h.cost_basis;

        return {
          ticker,
          name,
          shares,
          last_price: price,
          market_value: marketValue,
          cost_basis: costBasis,
        };
      })
      .filter((h) => h.ticker.length > 0 && h.shares > 0);

    const totalMarketValue = normalized.reduce(
      (sum, h) => sum + num(h.market_value, 0),
      0
    );

    const withWeights = normalized.map((h) => ({
      ...h,
      weight: totalMarketValue > 0 ? num(h.market_value, 0) / totalMarketValue : 0,
    }));

    // Sort by market value desc, then ticker
    withWeights.sort(
      (a, b) =>
        num(b.market_value, 0) - num(a.market_value, 0) ||
        a.ticker.localeCompare(b.ticker)
    );

    return NextResponse.json(
      {
        last_updated: parsed.last_updated ?? new Date().toISOString(),
        source: parsed.source ?? "data/active_holdings.json",
        total_market_value: totalMarketValue,
        holdings: withWeights,
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message ??
          "Failed to load holdings. Ensure data/active_holdings.json exists and is valid JSON.",
      },
      { status: 500 }
    );
  }
}
