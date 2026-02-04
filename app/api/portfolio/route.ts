import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Holding = {
  ticker: string;
  name: string;
  shares: number;
  cost_basis: number;
};

type PortfolioResponse = {
  last_updated: string;
  total_market_value: number;
  holdings: Array<
    Holding & {
      last_price: number;
      market_value: number;
      weight: number;
    }
  >;
};

async function fetchPrice(ticker: string, apiKey?: string): Promise<number> {
  if (!apiKey) return 0;

  const url = `https://api.api-ninjas.com/v1/stockprice?ticker=${encodeURIComponent(
    ticker
  )}`;

  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) return 0;

  const json = await res.json();
  return typeof json.price === "number" ? json.price : 0;
}

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "active_holdings.json"
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "active_holdings.json not found in /data" },
        { status: 500 }
      );
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const holdings: Holding[] = JSON.parse(raw);

    const apiKey = process.env.API_NINJAS_KEY;

    const prices: Record<string, number> = {};

    for (const h of holdings) {
      prices[h.ticker] = await fetchPrice(h.ticker, apiKey);
    }

    const enriched = holdings.map((h) => {
      const last_price = prices[h.ticker] ?? 0;
      const market_value = last_price * h.shares;

      return {
        ...h,
        last_price,
        market_value,
        weight: 0, // placeholder
      };
    });

    const total_market_value = enriched.reduce(
      (sum, h) => sum + h.market_value,
      0
    );

    const finalHoldings = enriched.map((h) => ({
      ...h,
      weight:
        total_market_value > 0
          ? h.market_value / total_market_value
          : 0,
    }));

    const response: PortfolioResponse = {
      last_updated: new Date().toISOString(),
      total_market_value,
      holdings: finalHoldings,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}
