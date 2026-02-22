import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = { ticker: string; name: string; shares: number; costBasis: number | null };

function normalizeTicker(raw: string) {
  return raw.trim().toUpperCase().replace(".", "-");
}

function stooqSymbol(ticker: string) {
  return `${ticker.toLowerCase()}.us`;
}

async function fetchStooqClose(ticker: string): Promise<number | null> {
  const sym = stooqSymbol(ticker);
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;

  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) return null;

  const cols = lines[1].split(",");
  const close = Number(cols[6]);

  if (!Number.isFinite(close) || close <= 0) return null;
  return close;
}

async function fetchQuotes(tickers: string[]) {
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
  return out;
}

function readPriorValue(cachePath: string): number | null {
  try {
    if (!fs.existsSync(cachePath)) return null;
    const raw = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    return typeof raw?.totalMarketValue === "number" ? raw.totalMarketValue : null;
  } catch {
    return null;
  }
}

function writeCache(cachePath: string, totalMarketValue: number) {
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(
      cachePath,
      JSON.stringify({ totalMarketValue, ts: new Date().toISOString() }),
      "utf-8"
    );
  } catch {}
}

export async function GET() {
  try {
    const holdingsPath = path.join(process.cwd(), "data", "active_holdings.json");
    const cachePath = path.join(process.cwd(), "data", "cache", "portfolio_snapshot.json");

    if (!fs.existsSync(holdingsPath)) {
      return NextResponse.json({ error: "Missing active_holdings.json", positions: [] }, { status: 500 });
    }

    const holdings: Holding[] = JSON.parse(fs.readFileSync(holdingsPath, "utf-8"));

    const cleaned = (holdings ?? [])
      .filter(h => h && typeof h.ticker === "string" && typeof h.shares === "number")
      .map(h => ({
        ticker: normalizeTicker(h.ticker),
        name: String(h.name ?? "").trim(),
        shares: h.shares,
        costBasis: typeof h.costBasis === "number" ? h.costBasis : null,
      }))
      .filter(h => h.ticker.length > 0 && h.shares > 0);

    const symbols = Array.from(new Set(cleaned.map(h => h.ticker))).slice(0, 200);
    const priceMap = await fetchQuotes(symbols);

    const positions = cleaned.map(h => {
      const price = priceMap[h.ticker];
      const priceVal = typeof price === "number" ? price : null;
      const marketValue = priceVal === null ? null : priceVal * h.shares;

      return {
        ticker: h.ticker,
        name: h.name,
        shares: h.shares,
        costBasis: h.costBasis,
        price: priceVal,
        marketValue,
      };
    });

    const totalMarketValue = positions.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);

    const priorValue = readPriorValue(cachePath);

    let dailyChange: number | null = null;

    if (priorValue && priorValue > 0) {
      dailyChange = ((totalMarketValue - priorValue) / priorValue) * 100;
    }

    writeCache(cachePath, totalMarketValue);

    return NextResponse.json({
      last_updated: new Date().toISOString(),
      quote_source: "stooq (EOD/close)",
      totalMarketValue,
      dailyChange,
      positions,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error", positions: [] }, { status: 500 });
  }
}
