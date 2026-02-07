import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type RawHolding =
  | {
      ticker?: string;
      symbol?: string;
      shares?: number | string;
      quantity?: number | string;
      name?: string;
      firm?: string;
      cost_basis?: number | string;
      costBasis?: number | string;
    }
  | any;

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/[$,]/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function normalizeHoldings(json: any): Array<{
  ticker: string;
  name: string;
  shares: number;
  cost_basis: number;
}> {
  const raw: RawHolding[] = Array.isArray(json)
    ? json
    : Array.isArray(json?.holdings)
      ? json.holdings
      : Array.isArray(json?.positions)
        ? json.positions
        : [];

  return raw
    .map((h) => {
      const t = String(h?.ticker ?? h?.symbol ?? "").trim().toUpperCase();
      const name = String(h?.name ?? h?.firm ?? "").trim();
      const shares = toNumber(h?.shares ?? h?.quantity);
      const cost_basis = toNumber(h?.cost_basis ?? h?.costBasis);

      return { ticker: t, name, shares, cost_basis };
    })
    .filter((h) => h.ticker && h.shares > 0);
}

async function readJsonFile(fileRelPath: string) {
  const filePath = path.join(process.cwd(), fileRelPath);
  const text = await fs.readFile(filePath, "utf-8");
  return JSON.parse(text);
}

export async function GET() {
  try {
    // IMPORTANT: this path is relative to the repo root
    // Ensure the file exists at: /data/active_holdings.json
    const json = await readJsonFile("data/active_holdings.json");
    const holdings = normalizeHoldings(json);

    // Prices are optional. If you later add EOD pricing, you can fill these in.
    // For now we return 0s so the UI works reliably.
    const enriched = holdings.map((h) => ({
      ...h,
      last_price: 0,
      market_value: 0,
      weight: 0,
    }));

    return NextResponse.json({
      last_updated: new Date().toISOString(),
      total_market_value: 0,
      holdings: enriched, // <-- ALWAYS an array
      error: null,
    });
  } catch (err: any) {
    // <-- Even on error, ALWAYS return holdings: []
    return NextResponse.json(
      {
        last_updated: null,
        total_market_value: 0,
        holdings: [],
        error:
          typeof err?.message === "string"
            ? err.message
            : "Unknown server error in /api/portfolio",
      },
      { status: 200 } // keep 200 so the page can render the error gracefully
    );
  }
}
