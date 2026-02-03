import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = {
  ticker: string;
  name: string;
  shares: number;
  cost_basis: number;
};

async function fetchPrice(ticker: string, apiKey: string): Promise<number | null> {
  try {
    const url = `https://api.api-ninjas.com/v1/stockprice?ticker=${encodeURIComponent(
      ticker
    )}`;

    const res = await fetch(url, {
      headers: {
        "X-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json();
    return typeof json?.price === "number" ? json.price : null;
  } catch {
    return null;
  }
}

function parseCsvLine(line: string): string[] {
  // Minimal CSV parser that supports quoted fields containing commas.
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // handle escaped quotes ""
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out.map((s) => s.trim());
}

export async function GET() {
  try {
    const apiKeyEnv = process.env.API_NINJAS_KEY;

    if (!apiKeyEnv) {
      return NextResponse.json(
        { error: "Missing API_NINJAS_KEY environment variable in Vercel." },
        { status: 500 }
      );
    }

    // IMPORTANT: use a guaranteed-string key so TypeScript is happy in async closures
    const key: string = apiKeyEnv;

    const filePath = path.join(
      process.cwd(),
      "data",
      "Individual-Positions-2026-02-02-205634.csv"
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `CSV not found at ${filePath}. Make sure it exists in /data and is committed to GitHub.` },
        { status: 500 }
      );
    }

    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) {
      return NextResponse.json(
        { error: "CSV file is empty." },
        { status: 500 }
      );
    }

    const lines = raw.split(/\r?\n/);
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row." },
        { status: 500 }
      );
    }

    // Expect header columns like:
    // ticker,name,shares,cost_basis
    // (case-insensitive, order can vary)
    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const idxTicker = header.indexOf("ticker");
    const idxName = header.indexOf("name");
    const idxShares = header.indexOf("shares");
    const idxCost = header.indexOf("cost_basis");

    if (idxTicker === -1 || idxName === -1 || idxShares === -1 || idxCost === -1) {
      return NextResponse.json(
        {
          error:
            "CSV header must include: ticker, name, shares, cost_basis (case-insensitive).",
          header_found: header,
        },
        { status: 500 }
      );
    }

    const holdings: Holding[] = [];

    for (let r = 1; r < lines.length; r++) {
      const line = lines[r].trim();
      if (!line) continue;

      const cols = parseCsvLine(line);

      const ticker = (cols[idxTicker] ?? "").trim();
      const name = (cols[idxName] ?? "").trim();

      const sharesRaw = (cols[idxShares] ?? "").replace(/,/g, "").trim();
      const costRaw = (cols[idxCost] ?? "").replace(/[$,]/g, "").trim();

      const shares = Number(sharesRaw);
      const cost_basis = Number(costRaw);

      if (!ticker) continue;
      if (!Number.isFinite(shares) || shares <= 0) continue;

      holdings.push({
        ticker,
        name,
        shares,
        cost_basis: Number.isFinite(cost_basis) ? cost_basis : 0,
      });
    }

    if (holdings.length === 0) {
      return NextResponse.json(
        { error: "No valid holdings found in CSV (check tickers/shares columns)." },
        { status: 500 }
      );
    }

    // Fetch prices with controlled concurrency
    const prices: Record<string, number | null> = {};

    const CONCURRENCY = 6;
    let i = 0;

    async function worker() {
      while (i < holdings.length) {
        const h = holdings[i++];
        prices[h.ticker] = await fetchPrice(h.ticker, key);
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    const enriched = holdings.map((h) => {
      const last_price = prices[h.ticker];
      const market_value = typeof last_price === "number" ? last_price * h.shares : 0;

      return {
        ticker: h.ticker,
        name: h.name,
        shares: h.shares,
        cost_basis: h.cost_basis,
        last_price,
        market_value,
      };
    });

    const total_market_value = enriched.reduce((sum, h) => sum + h.market_value, 0);

    return NextResponse.json({
      last_updated: new Date().toISOString(),
      quote_as_of: new Date().toISOString(),
      total_market_value,
      holdings: enriched,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
