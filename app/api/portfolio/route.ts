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

function stooqSymbol(ticker: string) {
  return `${ticker.toLowerCase()}.us`;
}

async function fetchTextWithTimeout(url: string, ms = 8000): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/csv,text/plain,*/*",
      },
    });

    if (!res.ok) return null;

    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Stooq historical daily CSV:
 * Date,Open,High,Low,Close,Volume
 */
async function fetchLastTwoCloses(ticker: string): Promise<QuoteRecord | null> {
  const sym = stooqSymbol(ticker);
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(sym)}&i=d`;

  const text = await fetchTextWithTimeout(url);
  if (!text) return null;

  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 3) return null;

  // Basic validation: first line should look like CSV header
  const header = lines[0].toLowerCase();
  if (!header.includes("date") || !header.includes("close")) {
    return null;
  }

  const rows = lines.slice(1);

  // Keep only rows that parse correctly and have positive close
  const parsed = rows
    .map((row) => row.split(","))
    .filter((cols) => cols.length >= 5)
    .map((cols) => ({
      date: cols[0],
      close: Number(cols[4]),
    }))
    .filter((r) => Number.isFinite(r.close) && r.close > 0);

  if (parsed.length < 2) return null;

  const last = parsed[parsed.length - 1];
  const prev = parsed[parsed.length - 2];

  return {
    close: last.close,
    prevClose: prev.close,
  };
}

async function fetchCloses(tickers: string[]) {
  const CONCURRENCY = 6;
  const queue = [...tickers];
  const out: Record<string, QuoteRecord> = {};

  async function worker() {
    while (queue.length) {
      const t = queue.shift();
      if (!t) return;
      const r = await fetchLastTwoCloses(t);
      if (r) out[t] = r;
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
      .filter((h) => h && typeof h.ticker === "string" && typeof h.shares === "number")
      .map((h) => ({
        ticker: normalizeTicker(h.ticker),
        name: String(h.name ?? "").trim(),
        shares: h.shares,
        costBasis: typeof h.costBasis === "number" ? h.costBasis : null,
      }))
      .filter((h) => h.ticker.length > 0 && h.shares > 0);

    const symbols = Array.from(new Set(cleaned.map((h) => h.ticker))).slice(0, 200);

    const closeMap = await fetchCloses(symbols);
    const missing = symbols.filter((s) => closeMap[s] == null);

    // If EVERYTHING failed, do not pretend the fund is worth $0
    if (symbols.length > 0 && missing.length === symbols.length) {
      return NextResponse.json(
        {
          error: "Quote provider failed for all symbols",
          quote_source: "stooq",
          positions: [],
          missing,
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
        quote_source: "stooq (daily close; daily change uses last two closes)",
        totalMarketValue,
        dailyChange,
        positions: withWeights,
        missing,
        quote_success_count: symbols.length - missing.length,
        quote_failure_count: missing.length,
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
