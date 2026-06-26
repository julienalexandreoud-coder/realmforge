import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET top 100 leaderboard
export async function GET() {
  try {
    const entries = await db.leaderboardEntry.findMany({
      orderBy: { totalShards: "desc" },
      take: 100,
    });
    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        playerName: e.playerName,
        totalShards: e.totalShards.toString(),
        prestige: e.prestige,
        maxLevel: e.maxLevel,
        country: e.country,
      })),
    });
  } catch (err) {
    return NextResponse.json({ entries: [], error: "db error" }, { status: 200 });
  }
}

// POST upsert a player's score (max semantics)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const playerName = String(body.playerName || "").trim().slice(0, 18);
    if (!playerName) return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });
    const totalShards = BigInt(Math.max(0, Math.floor(Number(body.totalShards) || 0)));
    const prestige = Math.max(0, Math.floor(Number(body.prestige) || 0));
    const maxLevel = Math.max(1, Math.floor(Number(body.maxLevel) || 1));

    // find existing by name (case-insensitive-ish: exact match)
    const existing = await db.leaderboardEntry.findFirst({ where: { playerName } });

    if (existing) {
      // only update if better
      const updateData: any = {};
      if (totalShards > existing.totalShards) updateData.totalShards = totalShards;
      if (prestige > existing.prestige) updateData.prestige = prestige;
      if (maxLevel > existing.maxLevel) updateData.maxLevel = maxLevel;
      if (Object.keys(updateData).length > 0) {
        await db.leaderboardEntry.update({ where: { id: existing.id }, data: updateData });
      }
    } else {
      await db.leaderboardEntry.create({
        data: { playerName, totalShards, prestige, maxLevel },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "db error" }, { status: 500 });
  }
}
