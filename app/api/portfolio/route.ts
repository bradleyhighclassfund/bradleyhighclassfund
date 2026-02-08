import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = { ticker: string; shares: number };
type Quote = { ticker: string; price: number; as_of: string };

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function normalizeTicker(raw: string) {
  return raw.trim().toUpperCase().replace(".", "-");
}

/**
 * Delayed quotes (free): API Ninjas Stock Price API.
 * Requires Vercel env var: API_NINJAS_KEY
 */
async function fetchDelayedQuotes(tickers: string[]): Promise<Quote[]> {
  const apiKey = process.env.API_NINJAS_KEY;

  // Runtime guard + compile-time narrowing
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Missing API_NINJAS_KEY (set it in Vercel → Settings → Environment Variables)");
  }

  // IMPORTANT: make the header value a definite string for TS
  const headers: HeadersInit = { "X-Api-Key": apiKey };

  const CONCURRENCY = 5;
  const queue = [...tickers];
  const results: Quote[] = [];

  async function worker() {
    while (queue.length) {
      const t = queue.shift();
      if (!t) return;

      const url = `https://api.api-ninjas.com/v1/stockprice?ticker=${encodeURIComponent(t)}`;
      const res = await fetch(url, {
        headers,
        cache: "no-store",
      });

      if (!res.ok) continue;

      const j: any = await res.json();
      const asOf = j.updated ? new Date(j.updated * 1000).toISOString() : new Date().toISOString();

      if (typeof j.price === "number" && j.ticker) {
        results.push({ ticker: String(j.ticker).toUpperCase(), price: j.price, as_of: asOf });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return results;
}

export async function GET() {
  try {
    const holdingsPath = path.join(process.cwd(), "data", "active_holdings.json");
    if (!fs.existsSync(holdingsPath)) {
      return NextResponse.json(
        { error: "Missing data/active_holdings.json", last_updated: null, holdings: [] },
        { status: 500 }
      );
    }

    const rawHoldings = readJson<Holding[]>(holdingsPath);

    const holdings = (rawHoldings ?? [])
      .filter((h) => h && typeof h.ticker === "string" && typeof h.shares === "number")
      .map((h) => ({ ticker: normalizeTicker(h.ticker), shares: h.shares }))
      .filter((h) => h.ticker.length > 0 && h.shares > 0);

    if (holdings.length === 0) {
      return NextResponse.json(
        {
          last_updated: new Date().toISOString(),
          quote_as_of: null,
          total_market_value: 0,
          holdings: [],
          missing: [],
          note: "active_holdings.json is empty",
        },
        { status: 200 }
      );
    }

    const tickers = Array.from(new Set(holdings.map((h) => h.ticker))).slice(0, 200);
    const quotes = await fetchDelayedQuotes(tickers);
    const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));

    const rows = holdings.map((h) => {
      const q = quoteMap.get(h.ticker);
      const price = q?.price ?? null;
      const mv = price === null ? null : h.shares * price;

      return { ticker: h.ticker, shares: h.shares, last_price: price, market_value: mv };
    });

    const totalMV = rows.reduce((acc, r) => acc + (r.market_value ?? 0), 0);
    const enriched = rows.map((r) => ({
      ...r,
      weight: r.market_value === null || totalMV === 0 ? null : r.market_value / totalMV,
    }));

    const missing = tickers.filter((t) => !quoteMap.has(t));

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        quote_as_of: quotes.length ? quotes[0].as_of : null,
        total_market_value: totalMV,
        holdings: enriched,
        missing,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "unknown error", last_updated: null, holdings: [] },
      { status: 500 }
    );
  }
}
