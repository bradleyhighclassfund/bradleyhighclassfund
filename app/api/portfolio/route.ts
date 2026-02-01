import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const cachePath = path.join(process.cwd(), "data", "cache", "portfolio_snapshot.json");

  if (!fs.existsSync(cachePath)) {
    return NextResponse.json(
      { error: "Portfolio cache not built yet. Wait for cron refresh.", last_updated: null },
      { status: 503 }
    );
  }

  const raw = fs.readFileSync(cachePath, "utf-8");
  return NextResponse.json(JSON.parse(raw), { status: 200 });
}
