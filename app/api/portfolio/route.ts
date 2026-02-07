import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HoldingInput = {
  ticker: string;
  name?: string;
  shares: number;
  cost_basis?: number | null; // total cost basis dollars
};

type ActiveHoldingsFile = {
  last_updated?: string;
  source?: string;
  holdings: HoldingInput[];
};

type EodCache = {
  asof: string; // YYYY-MM-DD (UTC)
  prices: Record<string, { close: number; date: string }>; // ticker -> {close, date}
};

function toNum(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function utcDateYYYYMMDD(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Stooq symbols for US equities are typically like: aapl.us
 * We'll try a couple variants for dot-tickers (e.g., BRK.B):
 * - brk.b.us
 * - brk-b.us
 */
function stooqSymbolCandidates(ticker: string): string[] {
  const t = ticker.trim().toLowerCase();
  const base = t.replace(/\s+/g, "");
  const cand = new Set<string>();
  cand.add(`${base}.us`);
  if (base.includes(".")) cand.add(`${base.replace(/\./g, "-")}.us`);
  // Some brokers use "/" in tickers; try dash variant
  if (base.includes("/")) cand.add(`${base.replace(/\//g, "-")}.us`);
  return Array.from(cand);
}

async function fetchStooqCloseForTicker(ticker: string): Promise<{ close: number; date: string } | null> {
  const candidates = stooqSymbolCandidates(ticker);

  for (const sym of candidates) {
    // Stooq daily CSV (last rows include latest close; EOD updates after market close)
    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(sym)}&i=d`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) continue;

    const text = await res.text();
    // CSV format: Date,Open,High,Low,Close,Volume
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) continue;

    const last = lines[lines.length - 1];
    const parts = last.split(",");
    if (parts.length < 5) continue;

    const date = parts[0]?.trim();
    const close = Number(parts[4]);

    if (date && Number.isFinite(close) && close > 0) {
      return { close, date };
    }
  }

  return null;
}

async function readJsonIfExists<T>(p: string): Promise<T | null> {
  try {
    const txt = await fs.readFile(p, "utf-8");
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

async function writeJson(p: string, obj: any): Promise<void> {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(obj, null, 2), "utf-8");
}

export async function GET() {
  try {
    const holdingsPath = path.join(process.cwd(), "data", "active_holdings.json");
    const raw = await fs.readFile(holdingsPath, "utf-8");
    const parsed = JSON.parse(raw) as ActiveHoldingsFile;

    const holdingsIn = Array.isArray(parsed.holdings) ? parsed.holdings : [];
    const holdings = holdingsIn
      .map((h) => ({
        ticker: (h.ticker ?? "").toString().trim().toUpperCase(),
        name: (h.name ?? "").toString().trim(),
        shares: toNum(h.shares, 0),
        cost_basis: h.cost_basis ?? null,
      }))
      .filter((h) => h.ticker && h.shares > 0);

    // Daily cache: avoids slow loads & repeated hits to Stooq
    const cachePath = path.join(process.cwd(), "data", "cache", "eod_prices.json");
    const today = utcDateYYYYMMDD();
    const cache = (await readJsonIfExists<EodCache>(cachePath)) ?? { asof: "", prices: {} };

    const prices: EodCache["prices"] = cache.asof === today ? cache.prices : {};

    // Fetch missing tickers (with controlled concurrency)
    const need = holdings
      .map((h) => h.ticker)
      .filter((t) => !(t in prices));

    const CONCURRENCY = 6;
    let i = 0;

    async function worker() {
      while (i < need.length) {
        const t = need[i++];
        const q = await fetchStooqCloseForTicker(t);
        if (q) {
          prices[t] = { close: q.close, date: q.date };
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    // Persist refreshed cache for the day
    await writeJson(cachePath, { asof: today, prices });

    const rows = holdings.map((h) => {
      const q = prices[h.ticker] ?? null;
      const last_price = q?.close ?? 0;
      const market_value = last_price * h.shares;

      const cost_basis = h.cost_basis;
      const unrealized_pl =
        cost_basis == null ? null : market_value - cost_basis;
      const unrealized_pl_pct =
        cost_basis == null || cost_basis === 0 ? null : (market_value - cost_basis) / cost_basis;

      return {
        ticker: h.ticker,
        name: h.name,
        shares: h.shares,
        cost_basis,
        price_date: q?.date ?? null,      // EOD date from Stooq
        last_price,                       // EOD close
        market_value,
        unrealized_pl,
        unrealized_pl_pct,
      };
    });

    const total_market_value = rows.reduce((s, r) => s + r.market_value, 0);

    const holdingsOut = rows
      .map((r) => ({
        ...r,
        weight: total_market_value > 0 ? r.market_value / total_market_value : 0,
      }))
      .sort((a, b) => b.market_value - a.market_value);

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        pricing: "EOD Close (Stooq)",
        total_market_value,
        holdings: holdingsOut,
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error in /api/portfolio" },
      { status: 500 }
    );
  }
}
