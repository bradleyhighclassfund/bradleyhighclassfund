import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type Holding = {
  ticker: string;
  name: string;
  shares: number;
  costBasis: number | null;
};

type QuoteRecord = {
  close: number;
  prevClose: number;
};

function normalizeTicker(raw: string) {
  return raw.trim().toUpperCase().replace(".", "-");
}

function yahooSymbol(ticker: string) {
  // Yahoo uses BRK-B style, which matches our normalized format.
  return ticker;
}

async function fetchYahooQuote(ticker: string): Promise<QuoteRecord | null> {
  const symbol = yahooSymbol(ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1d&range=5d`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json,text/plain,*/*",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();

    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const closes = result?.indicators?.quote?.[0]?.close;
    if (!Array.isArray(closes)) return null;

    const validCloses = closes
      .map((x: any) => Number(x))
      .filter((x: number) => Number.isFinite(x) && x > 0);

    if (validCloses.length < 2) return null;

    const close = validCloses[validCloses.length - 1];
    const prevClose = validCloses[validCloses.length - 2];

    if (!Number.isFinite(close) || !Number.isFinite(prevClose)) return null;

    return { close, prevClose };
  } catch {
    return null;
  }
}

async function fetchYahooQuotes(
  tickers: string[]
): Promise<{
  quotes: Record<string, QuoteRecord>;
  debug: any[];
}> {
  const quotes: Record<string, QuoteRecord> = {};
  const debug: any[] = [];

  const CONCURRENCY = 4;
  const queue = [...tickers];

  async function worker() {
    while (queue.length) {
      const ticker = queue.shift();
      if (!ticker) return;

      const quote = await fetchYahooQuote(ticker);

      if (quote) {
        quotes[ticker] = quote;
      } else {
        debug.push({
          ticker,
          error: "No valid Yahoo quote returned",
        });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  return { quotes, debug };
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
      .filter((h) => h && typeof h.ticker === "string" && typeof h.shares === "number")
      .map((h) => ({
        ticker: normalizeTicker(h.ticker),
        name: String(h.name ?? "").trim(),
        shares: h.shares,
        costBasis: typeof h.costBasis === "number" ? h.costBasis : null,
      }))
      .filter((h) => h.ticker.length > 0 && h.shares > 0);

    const symbols = Array.from(new Set(cleaned.map((h) => h.ticker))).slice(0, 200);

    const { quotes: closeMap, debug } = await fetchYahooQuotes(symbols);
    const missing = symbols.filter((s) => closeMap[s] == null);

    if (symbols.length > 0 && missing.length === symbols.length) {
      return NextResponse.json(
        {
          error: "Quote provider failed for all symbols",
          quote_source: "yahoo_chart_endpoint",
          positions: [],
          missing,
          debug,
        },
        { status: 502 }
      );
    }

    const positions = cleaned.map((h) => {
      const rec = closeMap[h.ticker];
      const price = rec?.close ?? null;
      const prevClose = rec?.prevClose ?? null;

      const marketValue = price === null ? null : price * h.shares;

      const dailyPct =
        price !== null && prevClose !== null && prevClose > 0
          ? ((price - prevClose) / prevClose) * 100
          : null;

      return {
        ticker: h.ticker,
        name: h.name,
        shares: h.shares,
        costBasis: h.costBasis,
        price,
        prevClose,
        marketValue,
        dailyPct,
      };
    });

    const validPositions = positions.filter(
      (p) => typeof p.marketValue === "number" && Number.isFinite(p.marketValue)
    );

    const totalMarketValue = validPositions.reduce(
      (sum, p) => sum + (p.marketValue as number),
      0
    );

    let dailyChange: number | null = null;
    if (totalMarketValue > 0) {
      let weightedSum = 0;
      let weightBase = 0;

      for (const p of validPositions) {
        if (typeof p.dailyPct === "number") {
          weightedSum += (p.marketValue as number) * p.dailyPct;
          weightBase += p.marketValue as number;
        }
      }

      if (weightBase > 0) dailyChange = weightedSum / weightBase;
    }

    const withWeights = positions.map((p) => ({
      ...p,
      weight:
        typeof p.marketValue === "number" && totalMarketValue > 0
          ? p.marketValue / totalMarketValue
          : null,
    }));

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        quote_source: "yahoo_chart_endpoint",
        totalMarketValue,
        dailyChange,
        positions: withWeights,
        missing,
        quote_success_count: symbols.length - missing.length,
        quote_failure_count: missing.length,
        debug,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message ?? "Server error",
        positions: [],
      },
      { status: 500 }
    );
  }
}
