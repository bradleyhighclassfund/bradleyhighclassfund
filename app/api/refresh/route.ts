import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE = "https://api.api-ninjas.com/v1/stockprice";

function parseTickersFromUrl(url: string): string[] {
  const u = new URL(url);
  const ticker = u.searchParams.get("ticker");
  const tickers = u.searchParams.get("tickers");

  const out: string[] = [];
  if (ticker) out.push(ticker);
  if (tickers) out.push(...tickers.split(","));

  return out
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .filter((t) => /^[A-Z0-9.\-]{1,10}$/.test(t));
}

async function fetchStockPrice(ticker: string, apiKey: string) {
  const url = `${API_BASE}?ticker=${encodeURIComponent(ticker)}`;

  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    return {
      ticker,
      ok: false as const,
      status: res.status,
      error: text || `API request failed (${res.status})`,
    };
  }

  try {
    const data = JSON.parse(text);
    return { ticker, ok: true as const, data };
  } catch {
    return {
      ticker,
      ok: false as const,
      status: 500,
      error: "Invalid JSON returned from API",
    };
  }
}

export async function GET(req: Request) {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API_NINJAS_KEY (set it in Vercel env vars for Production)" },
      { status: 500 }
    );
  }

  const tickers = parseTickersFromUrl(req.url);
  if (tickers.length === 0) {
    return NextResponse.json(
      { error: "Provide ?ticker=AAA or ?tickers=AAA,BBB" },
      { status: 400 }
    );
  }

  const limited = tickers.slice(0, 25);
  const results = await Promise.all(limited.map((t) => fetchStockPrice(t, apiKey)));

  return NextResponse.json({ count: results.length, results });
}

export async function POST(req: Request) {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API_NINJAS_KEY (set it in Vercel env vars for Production)" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tickersRaw =
    typeof body === "object" && body !== null && "tickers" in body
      ? (body as any).tickers
      : undefined;

  const tickers = Array.isArray(tickersRaw)
    ? tickersRaw
        .map((t: any) => String(t).trim().toUpperCase())
        .filter(Boolean)
        .filter((t: string) => /^[A-Z0-9.\-]{1,10}$/.test(t))
    : [];

  if (tickers.length === 0) {
    return NextResponse.json(
      { error: 'POST body must be like: { "tickers": ["AAPL","MSFT"] }' },
      { status: 400 }
    );
  }

  const limited = tickers.slice(0, 25);
  const results = await Promise.all(limited.map((t) => fetchStockPrice(t, apiKey)));

  return NextResponse.json({ count: results.length, results });
}
