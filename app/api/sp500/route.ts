import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const url = "https://stooq.com/q/d/l/?s=spy.us&i=d";
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ dailyChange: null }, { status: 200 });

  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 3) return NextResponse.json({ dailyChange: null }, { status: 200 });

  const last = lines[lines.length - 1].split(",");
  const prev = lines[lines.length - 2].split(",");

  const close = Number(last[4]);
  const prevClose = Number(prev[4]);

  if (!Number.isFinite(close) || !Number.isFinite(prevClose) || prevClose <= 0) {
    return NextResponse.json({ dailyChange: null }, { status: 200 });
  }

  const dailyChange = ((close - prevClose) / prevClose) * 100;

  return NextResponse.json(
    { last_updated: new Date().toISOString(), proxy: "SPY", dailyChange, close, prevClose },
    { status: 200 }
  );
}
