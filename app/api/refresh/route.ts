import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = { ticker: string; shares: number };
type Quote = { ticker: string; price: number; as_of: string };

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

/**
 * Delayed quotes (free): API Ninjas Stock Price API.
 * Keep API key server-side only (Vercel env var API_NINJAS_KEY).
 */
async function fetchDelayedQuotes(tickers: string[]): Promise<Quote[]> {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) throw new Error("Missing API_NINJAS_KEY (set in Vercel Environment Variables)");

  const CONCURRENCY = 5;
  const queue = [...tickers];
  const results: Quote[] = [];

  async function worker() {
    while (queue.length) {
      const t = queue.shift();
      if (!t) return;

      const url = `https://api.api-ninjas.com/v1/stockprice?ticker=${encodeURIComponent(t)}`;
      const res = await fetch(url, {
        headers: { "X-Api-Key": apiKey },
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
    const holdings = readJson<Holding[]>(holdingsPath);

    const tickers = holdings.map((h) => h.ticker.toUpperCase());
    const quotes = await fetchDelayedQuotes(tickers);
    const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));

    const rows = holdings.map((h) => {
      const t = h.ticker.toUpperCase();
      const q = quoteMap.get(t);
      const price = q?.price ?? null;
      const mv = price === null ? null : h.shares * price;

      return { ticker: t, shares: h.shares, last_price: price, market_value: mv };
    });

    const totalMV = rows.reduce((acc, r) => acc + (r.market_value ?? 0), 0);
    const enriched = rows.map((r) => ({
      ...r,
      weight: r.market_value === null || totalMV === 0 ? null : r.market_value / totalMV,
    }));

    const payload = {
      last_updated: new Date().toISOString(),
      quote_as_of: quotes.length ? quotes[0].as_of : null,
      total_market_value: totalMV,
      holdings: enriched,
    };

    const cacheDir = path.join(process.cwd(), "data", "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const cachePath = path.join(cacheDir, "portfolio_snapshot.json");
    fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), "utf-8");

    return NextResponse.json({ ok: true, last_updated: payload.last_updated }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
