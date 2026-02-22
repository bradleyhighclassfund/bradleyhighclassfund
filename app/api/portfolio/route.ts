import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type Holding = { ticker: string; name: string; shares: number; costBasis: number | null };

function normalizeTicker(raw: string) {
  return raw.trim().toUpperCase().replace(".", "-");
}

function stooqSymbol(ticker: string) {
  return `${ticker.toLowerCase()}.us`;
}

/** Stooq historical daily CSV: Date,Open,High,Low,Close,Volume */
async function fetchLastTwoCloses(ticker: string): Promise<{ close: number; prevClose: number } | null> {
  const sym = stooqSymbol(ticker);
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(sym)}&i=d`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;

  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 3) return null;

  const last = lines[lines.length - 1].split(",");
  const prev = lines[lines.length - 2].split(",");

  const close = Number(last[4]);
  const prevClose = Number(prev[4]);

  if (!Number.isFinite(close) || close <= 0) return null;
  if (!Number.isFinite(prevClose) || prevClose <= 0) return null;

  return { close, prevClose };
}

async function fetchCloses(tickers: string[]) {
  const CONCURRENCY = 8;
  const queue = [...tickers];
  const out: Record<string, { close: number; prevClose: number }> = {};

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
      return NextResponse.json({ error: "Missing data/active_holdings.json", positions: [] }, { status: 500 });
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

    const totalMarketValue = positions.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);

    // MV-weighted average of dailyPct across positions with valid dailyPct
    let dailyChange: number | null = null;
    if (totalMarketValue > 0) {
      let weightedSum = 0;
      let weightBase = 0;

      for (const p of positions) {
        if (typeof p.marketValue === "number" && typeof p.dailyPct === "number") {
          weightedSum += p.marketValue * p.dailyPct;
          weightBase += p.marketValue;
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

    const missing = symbols.filter((s) => closeMap[s] == null);

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        quote_source: "stooq (daily close; daily change uses last two closes)",
        totalMarketValue,
        dailyChange,
        positions: withWeights,
        missing,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error", positions: [] }, { status: 500 });
  }
}
