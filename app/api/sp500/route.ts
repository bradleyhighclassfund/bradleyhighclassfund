import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const url =
      "https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=5d";

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json,text/plain,*/*",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ dailyChange: null }, { status: 200 });
    }

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close;

    if (!Array.isArray(closes)) {
      return NextResponse.json({ dailyChange: null }, { status: 200 });
    }

    const validCloses = closes
      .map((x: any) => Number(x))
      .filter((x: number) => Number.isFinite(x) && x > 0);

    if (validCloses.length < 2) {
      return NextResponse.json({ dailyChange: null }, { status: 200 });
    }

    const close = validCloses[validCloses.length - 1];
    const prevClose = validCloses[validCloses.length - 2];
    const dailyChange = ((close - prevClose) / prevClose) * 100;

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        proxy: "SPY",
        quote_source: "yahoo_chart_endpoint",
        dailyChange,
        close,
        prevClose,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ dailyChange: null }, { status: 200 });
  }
}
