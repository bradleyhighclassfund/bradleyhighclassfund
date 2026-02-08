import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

type Holding = {
  ticker: string;
  name?: string;
  shares: number;
  cost_basis?: number | null;
};

type HoldingsFile =
  | Holding[]
  | { as_of?: string; cash?: number; holdings?: Holding[] };

function toArray(v: unknown): Holding[] {
  if (Array.isArray(v)) return v as Holding[];
  if (v && typeof v === "object" && Array.isArray((v as any).holdings)) return (v as any).holdings as Holding[];
  return [];
}

// Stooq is free and gives end-of-day (typically prior close). No key needed.
// Example: https://stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&h&e=csv
async function fetchEodCloseUSD(ticker: string): Promise<{ close: number | null; date: string | null }> {
  // Stooq uses dash for class shares; keep simple normalization.
  const sym = ticker.trim().toLowerCase().replace(/\./g, "-") + ".us";
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;

  const res = await fetch(url, { next: { revalidate: 3600 } }); // refresh at most hourly
  if (!res.ok) return { close: null, date: null };

  const txt = await res.text();
  const lines = txt.trim().split(/\r?\n/);
  if (lines.length < 2) return { close: null, date: null };

  const headers = lines[0].split(",");
  const values = lines[1].split(",");

  const idxClose = headers.findIndex((h) => h.toLowerCase() === "close");
  const idxDate = headers.findIndex((h) => h.toLowerCase() === "date");

  const closeStr = idxClose >= 0 ? values[idxClose] : "";
  const dateStr = idxDate >= 0 ? values[idxDate] : "";

  const close = closeStr && closeStr !== "N/A" ? Number(closeStr) : null;
  const date = dateStr && dateStr !== "N/A" ? dateStr : null;

  return { close: Number.isFinite(close as any) ? (close as number) : null, date };
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "active_holdings.json");
    const raw = await readFile(filePath, "utf-8");
    const parsed: HoldingsFile = JSON.parse(raw);

    const holdings = toArray(parsed);

    // If empty, return a stable shape (prevents front-end .map crashes)
    if (!holdings.length) {
      return NextResponse.json({
        last_updated: new Date().toISOString(),
        quote_as_of: null,
        total_market_value: 0,
        holdings: [],
      });
    }

    // Fetch prices sequentially to reduce rate/timeout risk
    const priced = [];
    let quoteAsOf: string | null = null;

    for (const h of holdings) {
      const ticker = String(h.ticker || "").trim().toUpperCase();
      const shares = Number(h.shares || 0);

      const { close, date } = await fetchEodCloseUSD(ticker);
      if (!quoteAsOf && date) quoteAsOf = date;

      const lastPrice = close ?? 0;
      const marketValue = shares * lastPrice;

      priced.push({
        ticker,
        name: h.name ?? "",
        shares,
        cost_basis: h.cost_basis ?? null,
        last_price: lastPrice,
        market_value: marketValue,
      });
    }

    const total = priced.reduce((s, x) => s + (Number(x.market_value) || 0), 0);

    // weights
    const withWeights = priced.map((x) => ({
      ...x,
      weight: total > 0 ? x.market_value / total : 0,
    }));

    return NextResponse.json({
      last_updated: new Date().toISOString(),
      quote_as_of: quoteAsOf,
      total_market_value: total,
      holdings: withWeights,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? String(err ?? "Unknown error") },
      { status: 500 }
    );
  }
}
