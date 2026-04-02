import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Candidate = {
  ticker: string;
  name: string;
};

type CandidateWithPerformance = Candidate & {
  currentPrice: number | null;
  oneYearPerformance: number | null;
  fiveYearPerformance: number | null;
};

const CANDIDATES: Candidate[] = [
  { ticker: "PANW", name: "Palo Alto Networks, Inc." },
  { ticker: "NOW", name: "ServiceNow, Inc." },
  { ticker: "UBER", name: "Uber Technologies, Inc." },
  { ticker: "IOVA", name: "Iovance Biotherapeutics, Inc." },
  { ticker: "TWST", name: "Twist Bioscience Corporation" },
];

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getLastValid(values: unknown[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) {
    const n = toNumber(values[i]);
    if (n !== null && n > 0) return n;
  }
  return null;
}

function findClosestHistoricalValue(
  timestamps: number[],
  prices: (number | null)[],
  targetUnixSeconds: number
): number | null {
  let bestIndex = -1;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const px = prices[i];

    if (!Number.isFinite(ts) || px === null || !Number.isFinite(px) || px <= 0) {
      continue;
    }

    const diff = Math.abs(ts - targetUnixSeconds);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  if (bestIndex === -1) return null;
  return prices[bestIndex];
}

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

async function fetchPerformanceForTicker(
  ticker: string
): Promise<{
  currentPrice: number | null;
  oneYearPerformance: number | null;
  fiveYearPerformance: number | null;
}> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?interval=1mo&range=6y&includeAdjustedClose=true`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (!res.ok) {
    return {
      currentPrice: null,
      oneYearPerformance: null,
      fiveYearPerformance: null,
    };
  }

  const data = await res.json();
  const result = data?.chart?.result?.[0];

  const timestampsRaw = result?.timestamp;
  const adjCloseRaw = result?.indicators?.adjclose?.[0]?.adjclose;
  const closeRaw = result?.indicators?.quote?.[0]?.close;

  if (!Array.isArray(timestampsRaw)) {
    return {
      currentPrice: null,
      oneYearPerformance: null,
      fiveYearPerformance: null,
    };
  }

  const timestamps: number[] = timestampsRaw.map((x: unknown) => Number(x));
  const baseSeries = Array.isArray(adjCloseRaw) ? adjCloseRaw : closeRaw;

  if (!Array.isArray(baseSeries)) {
    return {
      currentPrice: null,
      oneYearPerformance: null,
      fiveYearPerformance: null,
    };
  }

  const prices: (number | null)[] = baseSeries.map((x: unknown) => {
    const n = Number(x);
    return Number.isFinite(n) && n > 0 ? n : null;
  });

  const currentPrice = getLastValid(prices);
  if (currentPrice === null) {
    return {
      currentPrice: null,
      oneYearPerformance: null,
      fiveYearPerformance: null,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const oneYearAgo = now - 365 * 24 * 60 * 60;
  const fiveYearsAgo = now - 5 * 365 * 24 * 60 * 60;

  const oneYearBase = findClosestHistoricalValue(timestamps, prices, oneYearAgo);
  const fiveYearBase = findClosestHistoricalValue(timestamps, prices, fiveYearsAgo);

  return {
    currentPrice,
    oneYearPerformance: pctChange(currentPrice, oneYearBase),
    fiveYearPerformance: pctChange(currentPrice, fiveYearBase),
  };
}

export async function GET() {
  try {
    const results = await Promise.all(
      CANDIDATES.map(async (candidate) => {
        const perf = await fetchPerformanceForTicker(candidate.ticker);
        return {
          ...candidate,
          ...perf,
        } satisfies CandidateWithPerformance;
      })
    );

    return NextResponse.json(
      {
        last_updated: new Date().toISOString(),
        quote_source: "yahoo_chart_endpoint",
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
