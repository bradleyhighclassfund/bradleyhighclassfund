// app/api/refresh/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensures Node runtime on Vercel (safe default)

const API_BASE = "https://api.api-ninjas.com/v1/stockprice";

function parseTickersFromUrl(url: string): string[] {
  const u = new URL(url);
  const ticker = u.searchParams.get("ticker");
  const tickers = u.searchParams.get("tickers");

  const out: string[] = [];
  if (ticker) out.push(ticker);
  if (tickers) out.push(...tickers.split(","));

  // normalize
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

  const text = await res.text(); // read once; parse conditionally
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
      ok: fals
