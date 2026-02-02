import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = { ticker: string; shares: number };
type QuoteRow = {
  ticker: string;
  shares: number;
  last_price: number | null;
  market_value: number | null;
  weight: number | null;
};

async function fetchPrice(ticker: string, apiKey: string) {
  const url = `https://api.api-ninjas.com/v1/stockprice?ticker=${encodeURIComponent(ticker)}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const j: any = await res.json();
  return typeof j?.price === "number" ? j.price : null;
}

export async function GET() {
  try {
    // Read holdings from repo (always available)
    const holdingsPath = path.join(process.cwd(), "data", "active_holdings.json");
    const holdings = JSON.parse(fs.readFileSync(holdingsPath, "utf-8")) as Holding[];

    const apiKey = process.env.API_NINJAS_KEY;

    // If no key, return holdings with null prices instead of crashing
    if (!apiKey) {
      const rows: QuoteRow[] = holdings.map((h) => ({
        ticker: h.ticker.toUpperCase(),
        shares: h.shares,
        last_price: null,
        market_value: null,
        weight: null,
      }));

      return NextResponse.json(
        {
          last_updated: new Date().toISOString(),
          quote_as_of: null,
          total_market_value: 0,
          holdings: rows,
          note: "API_NINJAS_KEY not set; prices unavailable.",
        },
        { status: 200 }
      );
    }

    // Fetch prices (simple + reliable)
    const rows: QuoteRow[] = [];
    for (const h of holdings) {
      const t = h.ticker.toUpperCase();
      const price = await fetchPrice(t, apiKey);
      const mv = price === null ? null : price * h.shares;
      rows.push({ ticker: t, shares: h.shares, last_price: price, market_value: mv, weight: null });
    }

    const totalMV = rows.reduce((acc, r) => acc + (r.market_value ?? 0), 0);
    const enriched = rows.map((r) => ({
      ...r,
      weight: r.market_value === null || totalMV === 0 ? null : r.market_value / totalMV,
    }));

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        quote_as_of: new Date().toISOString(),
        total_market_value: totalMV,
        holdings: enriched,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
