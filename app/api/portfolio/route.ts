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

async function fetchFmpQuotes(tickers: string[]): Promise<Record<string, QuoteRecord>> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error("Missing FMP_API_KEY");
  }

  const chunks: string[][] = [];
  for (let i = 0; i < tickers.length; i += 25) {
    chunks.push(tickers.slice(i, i + 25));
  }

  const out: Record<string, QuoteRecord> = {};

  for (const chunk of chunks) {
    const symbols = chunk.join(",");
    const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbols)}?apikey=${apiKey}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) continue;

    const data = await res.json();
    if (!Array.isArray(data)) continue;

    for (const row of data) {
      const symbol = normalizeTicker(String(row.symbol ?? ""));
      const price = Number(row.price);
      const prevClose = Number(row.previousClose);

      if (
        symbol &&
        Number.isFinite(price) &&
        price > 0 &&
        Number.isFinite(prevClose) &&
        prevClose > 0
      ) {
        out[symbol] = { close: price, prevClose };
      }
    }
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
      .map((h) => ({
        ticker: normalizeTicker(h.ticker),
        name: String(h.name ?? "").trim(),
        shares: h.shares,
        costBasis: typeof h.costBasis === "number" ? h.costBasis : null,
      }))
      .filter((h) => h.ticker.length > 0 && h.shares > 0);

    const symbols = Array.from(new Set(cleaned.map((h) => h.ticker))).slice(0, 200);
    const closeMap = await fetchFmpQuotes(symbols);

    const missing = symbols.filter((s) => closeMap[s] == null);

    if (symbols.length > 0 && missing.length === symbols.length) {
      return NextResponse.json(
        {
          error: "Quote provider failed for all symbols",
          quote_source: "financialmodelingprep",
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
        quote_source: "financialmodelingprep",
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
