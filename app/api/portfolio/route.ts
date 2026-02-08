import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = { ticker: string; shares: number };

function normalizeTicker(raw: string) {
  return raw.trim().toUpperCase().replace(".", "-");
}

export async function GET() {
  try {
    const holdingsPath = path.join(process.cwd(), "data", "active_holdings.json");

    if (!fs.existsSync(holdingsPath)) {
      return NextResponse.json(
        { error: "Missing data/active_holdings.json", positions: [] },
        { status: 500 }
      );
    }

    const holdings: Holding[] = JSON.parse(fs.readFileSync(holdingsPath, "utf-8"));

    const cleaned = holdings
      .filter(h => h && typeof h.ticker === "string" && typeof h.shares === "number")
      .map(h => ({ ticker: normalizeTicker(h.ticker), shares: h.shares }))
      .filter(h => h.shares > 0);

    if (cleaned.length === 0) {
      return NextResponse.json(
        { positions: [], totalMarketValue: 0, missing: [] },
        { status: 200 }
      );
    }

    const symbols = Array.from(new Set(cleaned.map(h => h.ticker))).slice(0, 100);
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
      symbols.join(",")
    )}`;

    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Yahoo quote fetch failed (${resp.status})`, positions: [] },
        { status: 200 }
      );
    }

    const data = await resp.json();
    const results: any[] = data?.quoteResponse?.result ?? [];

    const priceMap: Record<string, number> = {};
    for (const q of results) {
      if (q?.symbol && typeof q?.regularMarketPrice === "number") {
        priceMap[q.symbol] = q.regularMarketPrice;
      }
    }

    const positions = cleaned.map(h => {
      const price = priceMap[h.ticker];
      const marketValue = price ? price * h.shares : null;
      return {
        ticker: h.ticker,
        shares: h.shares,
        price,
        marketValue,
      };
    });

    const totalMarketValue = positions.reduce(
      (sum, p) => sum + (p.marketValue ?? 0),
      0
    );

    const withWeights = positions.map(p => ({
      ...p,
      weight:
        p.marketValue && totalMarketValue > 0
          ? p.marketValue / totalMarketValue
          : null,
    }));

    const missing = symbols.filter(s => priceMap[s] == null);

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        totalMarketValue,
        positions: withWeights,
        missing,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error", positions: [] },
      { status: 500 }
    );
  }
}
