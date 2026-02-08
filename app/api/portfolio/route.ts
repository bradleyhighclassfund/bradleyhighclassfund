import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = { ticker: string; shares: number };

function normalizeTicker(raw: string) {
  // Normalize class tickers like BRK.B -> BRK-B
  return raw.trim().toUpperCase().replace(".", "-");
}

function stooqSymbol(ticker: string) {
  // Stooq US format: aapl.us
  return `${ticker.toLowerCase()}.us`;
}

async function fetchStooqClose(ticker: string): Promise<number | null> {
  // CSV: Symbol,Date,Time,Open,High,Low,Close,Volume
  const sym = stooqSymbol(ticker);
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;

  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) return null;

  const cols = lines[1].split(",");
  const closeStr = cols[6]; // Close column in f=sd2t2ohlcv
  const close = Number(closeStr);

  if (!Number.isFinite(close) || close <= 0) return null;
  return close;
}

async function fetchYahooSingle(ticker: string): Promise<number | null> {
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
    ticker
  )}`;

  const res = await fetch(url, {
    headers: {
      // Some environments block without a UA
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;

  const j = await res.json();
  const q = j?.quoteResponse?.result?.[0];
  return typeof q?.regularMarketPrice === "number" ? q.regularMarketPrice : null;
}

async function fetchQuotesStooqWithFallback(tickers: string[]) {
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

  // Stooq gap: SQ (Block Inc) often missing. Use Yahoo fallback for SQ only.
  if (out["SQ"] == null && tickers.includes("SQ")) {
    const sq = await fetchYahooSingle("SQ");
    if (sq !== null) out["SQ"] = sq;
  }

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
      .filter((h) => h && typeof h.ticker === "string" && typeof h.shares === "number")
      .map((h) => ({ ticker: normalizeTicker(h.ticker), shares: h.shares }))
      .filter((h) => h.ticker.length > 0 && h.shares > 0);

    if (cleaned.length === 0) {
      return NextResponse.json(
        {
          last_updated: new Date().toISOString(),
          quote_source: "stooq (EOD/last close) + yahoo fallback for SQ",
          totalMarketValue: 0,
          positions: [],
          missing: [],
          note: "active_holdings.json is empty",
        },
        { status: 200 }
      );
    }

    const symbols = Array.from(new Set(cleaned.map((h) => h.ticker))).slice(0, 200);
    const priceMap = await fetchQuotesStooqWithFallback(symbols);

    const positions = cleaned.map((h) => {
      const price = priceMap[h.ticker];
      const priceVal = typeof price === "number" ? price : null;
      const marketValue = priceVal === null ? null : priceVal * h.shares;

      return {
        ticker: h.ticker,
        shares: h.shares,
        price: priceVal,
        marketValue,
      };
    });

    const totalMarketValue = positions.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);

    const withWeights = positions.map((p) => ({
      ...p,
      weight:
        typeof p.marketValue === "number" && totalMarketValue > 0
          ? p.marketValue / totalMarketValue
          : null,
    }));

    const missing = symbols.filter((s) => priceMap[s] == null);

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        quote_source: "stooq (EOD/last close) + yahoo fallback for SQ",
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
