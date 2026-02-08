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
        { error: "Missing data/active_holdings.json", last_updated: null, positions: [] },
        { status: 500 }
      );
    }

    const holdingsRaw = fs.readFileSync(holdingsPath, "utf-8");
    const holdings: Holding[] = JSON.parse(holdingsRaw);

    const cleaned = (holdings ?? [])
      .filter(h => h && typeof h.ticker === "string" && typeof h.shares === "number")
      .map(h => ({ ticker: normalizeTicker(h.ticker), shares: h.shares }))
      .filter(h => h.ticker.length > 0 && h.shares > 0);

    if (cleaned.length === 0) {
      return NextResponse.json(
        {
          last_updated: new Date().toISOString(),
          positions: [],
          missing: [],
          note: "No holdings found (active_holdings.json is empty).",
        },
        { status: 200 }
      );
    }

    const symbols = Array.from(new Set(cleaned.map(h => h.ticker))).slice(0, 100);

    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
      symbols.join(",")
    )}`;

    const resp = await fetch(url, {
      // Cache the quote response for 5 minutes at the edge/server
      next: { revalidate: 300 },
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json,text/plain,*/*",
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Quote fetch failed: ${resp.status}`,
          detail: text.slice(0, 300),
          last_updated: new Date().toISOString(),
          positions: [],
          missing: symbols,
        },
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
      const marketValue = typeof price === "number" ? price * h.shares : undefined;
      return {
        ticker: h.ticker,
        shares: h.shares,
        price,
        marketValue,
      };
    });

    const totalMarketValue = positions.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);

    const positionsWithWeights = positions.map(p => ({
      ...p,
      weight:
        typeof p.marketValue === "number" && totalMarketValue > 0
          ? p.marketValue / totalMarketValue
          : undefined,
    }));

    const missing = symbols.filter(s => priceMap[s] == null);

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        totalMarketValue,
        positions: positionsWithWeights,
        missing,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Server error computing portfolio",
        detail: e?.message ?? String(e),
        last_updated: null,
        positions: [],
      },
      { status: 500 }
    );
  }
}
