import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

type Holding = {
  ticker: string;
  shares: number;
  name?: string | null;
  cost_basis?: number | null; // total dollars
};

type EodPrice = {
  close: number;
  date: string; // YYYY-MM-DD
};

type PriceCache = {
  asOf: string; // ISO time when cache was written
  prices: Record<string, EodPrice>;
};

function projectPath(...parts: string[]) {
  return path.join(process.cwd(), ...parts);
}

function normalizeTicker(t: string) {
  return (t || "").trim().toUpperCase();
}

// Free EOD data from Stooq (usually works for US tickers with .US suffix)
async function fetchEodCloseFromStooq(ticker: string): Promise<EodPrice | null> {
  const t = normalizeTicker(ticker);
  if (!t) return null;

  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(t.toLowerCase())}.us&i=d`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "bradleyhighclassfund/1.0" },
  });

  if (!res.ok) return null;

  const text = await res.text();
  // CSV format:
  // Date,Open,High,Low,Close,Volume
  // 2026-02-06,xxx,xxx,xxx,123.45,999999
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return null;

  const header = lines[0].split(",");
  const row = lines[lines.length - 1].split(",");

  const dateIdx = header.findIndex((h) => h.toLowerCase() === "date");
  const closeIdx = header.findIndex((h) => h.toLowerCase() === "close");

  if (dateIdx < 0 || closeIdx < 0) return null;

  const date = row[dateIdx];
  const close = Number(row[closeIdx]);

  if (!date || !Number.isFinite(close) || close <= 0) return null;

  return { date, close };
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile(filePath: string, obj: any) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), "utf-8");
}

export async function GET() {
  try {
    const holdingsPath = projectPath("data", "active_holdings.json");
    const cachePath = projectPath("data", "cache", "eod_prices.json");

    // Load holdings
    let holdingsRaw: Holding[];
    try {
      holdingsRaw = await readJsonFile<Holding[]>(holdingsPath);
    } catch {
      return NextResponse.json(
        { error: `Holdings file not found: ${holdingsPath}. Commit data/active_holdings.json to GitHub.` },
        { status: 500 }
      );
    }

    const holdings: Holding[] = (holdingsRaw || [])
      .map((h) => ({
        ticker: normalizeTicker(h.ticker),
        shares: Number(h.shares || 0),
        name: h.name ?? null,
        cost_basis: h.cost_basis ?? null,
      }))
      .filter((h) => h.ticker && Number.isFinite(h.shares) && h.shares > 0);

    // Load cache if present
    let cache: PriceCache | null = null;
    try {
      cache = await readJsonFile<PriceCache>(cachePath);
    } catch {
      cache = null;
    }

    const now = new Date();
    const cacheAgeMs = cache?.asOf ? now.getTime() - new Date(cache.asOf).getTime() : Number.POSITIVE_INFINITY;

    // Refresh cache if older than 12 hours or missing
    const needRefresh = !cache || !cache.prices || cacheAgeMs > 12 * 60 * 60 * 1000;

    const prices: Record<string, EodPrice> = { ...(cache?.prices || {}) };

    if (needRefresh) {
      for (const h of holdings) {
        if (!prices[h.ticker]) {
          const p = await fetchEodCloseFromStooq(h.ticker);
          if (p) prices[h.ticker] = p;
        }
      }

      // Also refresh any stale/invalid entries (optional light pass)
      // If you want every ticker refreshed daily, uncomment this block:
      /*
      for (const h of holdings) {
        const p = await fetchEodCloseFromStooq(h.ticker);
        if (p) prices[h.ticker] = p;
      }
      */

      await writeJsonFile(cachePath, { asOf: now.toISOString(), prices } satisfies PriceCache);
    }

    // Compute totals
    const rows = holdings.map((h) => {
      const p = prices[h.ticker];
      const last_price = p?.close ?? null;
      const market_value = last_price ? h.shares * last_price : null;

      return {
        ticker: h.ticker,
        name: h.name ?? null,
        shares: h.shares,
        cost_basis: h.cost_basis ?? null,
        last_price,
        market_value,
        weight: null as number | null,
      };
    });

    const total_market_value = rows.reduce((sum, r) => sum + (r.market_value ?? 0), 0);

    for (const r of rows) {
      r.weight = total_market_value > 0 && r.market_value != null ? r.market_value / total_market_value : 0;
    }

    // Determine quote_as_of as the most recent date we have across tickers
    const quoteDates = rows
      .map((r) => prices[r.ticker]?.date)
      .filter((d): d is string => typeof d === "string" && d.length > 0)
      .sort();
    const quote_as_of_date = quoteDates.length ? quoteDates[quoteDates.length - 1] : null;

    return NextResponse.json({
      last_updated: now.toISOString(),
      quote_as_of: quote_as_of_date ? new Date(`${quote_as_of_date}T21:00:00Z`).toISOString() : null, // approx EOD
      total_market_value,
      holdings: rows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
