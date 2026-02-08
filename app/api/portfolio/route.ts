import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = { ticker: string; shares: number };

function normalizeTicker(raw: string) {
  // Stooq uses BRK-B style, so normalize "." -> "-"
  return raw.trim().toUpperCase().replace(".", "-");
}

function stooqSymbol(ticker: string) {
  // Stooq uses lowercase and US suffix like aapl.us
  return `${ticker.toLowerCase()}.us`;
}

async function fetchStooqClose(ticker: string): Promise<number | null> {
  // CSV: Symbol,Date,Time,Open,High,Low,Close,Volume
  const sym = stooqSymbol(ticker);
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;

  const res = await fetch(url, {
    // Cache at the platform for 5 minutes
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;

  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) return null;

  const cols = lines[1].split(",");
  // Close is column index 6 in our f=... format (0-based: 6)
  const closeStr = cols[6];
  const close = Number(closeStr);

  if (!Number.isFinite(close) || close <= 0) return null;
  return close;
}

async function fetchQuotes(tickers: string[]) {
  // Limit concurrency so Vercel doesn’t throttle outbound requests
  const CONCURRENCY = 8;
  const queue = [...tickers];
  const out: Record<string, number> = {};

  async function worker() {
    while (queue.length) {
      const t = queue.shift();
      if (!t) return;
      const px = await fetchStooqClose(t);
      if (px !== null) out[t] = px;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return out;
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

    const cleaned = (holdings ?? [])
      .filter(h => h && typeof h.ticker === "string" && typeof h.shares === "number")
      .map(h => ({ ticker: normalizeTicker(h.ticker), shares: h.shares }))
      .filter(h => h.ticker.length > 0 && h.shares > 0);

    if (cleaned.length === 0) {
      return NextResponse.json(
        { last_updated: new Date().toISOString(), totalMarketValue: 0, positions: [], missing: [] },
        { status: 200 }
      );
    }

    const symbols = Array.from(new Set(cleaned.map(h => h.ticker))).slice(0, 200);
    const priceMap = await fetchQuotes(symbols);

    const positions = cleaned.map(h => {
      const price = priceMap[h.ticker];
      const marketValue = typeof price === "number" ? price * h.shares : null;
      return {
        ticker: h.ticker,
        shares: h.shares,
        price: typeof price === "number" ? price : null,
        marketValue,
      };
    });

    const totalMarketValue = positions.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);

    const withWeights = positions.map(p => ({
      ...p,
      weight:
        typeof p.marketValue === "number" && totalMarketValue > 0
          ? p.marketValue / totalMarketValue
          : null,
    }));

    const missing = symbols.filter(s => priceMap[s] == null);

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        quote_source: "stooq (EOD/last close)",
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
