import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Candidate = {
  ticker: string;
  name: string;
  pitchedPrice: number;
  selected: boolean;
};

type CandidateWithPerformance = Candidate & {
  currentPrice: number | null;
  pitchedPerformance: number | null;
};

const CANDIDATES: Candidate[] = [
  {
    ticker: "PANW",
    name: "Palo Alto Networks, Inc.",
    pitchedPrice: 183.8,
    selected: true,
  },
  {
    ticker: "NOW",
    name: "ServiceNow, Inc.",
    pitchedPrice: 994.35,
    selected: false,
  },
  {
    ticker: "UBER",
    name: "Uber Technologies, Inc.",
    pitchedPrice: 74.69,
    selected: true,
  },
  {
    ticker: "IOVA",
    name: "Iovance Biotherapeutics, Inc.",
    pitchedPrice: 1.54,
    selected: false,
  },
  {
    ticker: "TWST",
    name: "Twist Bioscience Corporation",
    pitchedPrice: 34.76,
    selected: false,
  },
];

function pctChange(current: number | null, prior: number | null): number | null {
  if (
    current === null ||
    prior === null ||
    !Number.isFinite(current) ||
    !Number.isFinite(prior) ||
    prior <= 0
  ) {
    return null;
  }

  return ((current - prior) / prior) * 100;
}

async function fetchCurrentPrice(ticker: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?interval=1d&range=5d`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json,text/plain,*/*",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;

    if (!Array.isArray(closes)) return null;

    const validCloses = closes
      .map((x: unknown) => Number(x))
      .filter((x: number) => Number.isFinite(x) && x > 0);

    if (validCloses.length === 0) return null;

    return validCloses[validCloses.length - 1];
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      CANDIDATES.map(async (candidate) => {
        const currentPrice = await fetchCurrentPrice(candidate.ticker);

        return {
          ...candidate,
          currentPrice,
          pitchedPerformance: pctChange(currentPrice, candidate.pitchedPrice),
        } satisfies CandidateWithPerformance;
      })
    );

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        quote_source: "yahoo_chart_endpoint",
        pitch_date: "2026-04-28",
        performance_base_date: "2026-04-24",
        items: results,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message ?? "Server error",
        items: [],
      },
      { status: 500 }
    );
  }
}
