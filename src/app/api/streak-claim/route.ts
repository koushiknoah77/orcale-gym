import { NextRequest, NextResponse } from "next/server";
import { getRequestOwnerId } from "@/lib/request-owner";
import { claimDailyStreak } from "@/lib/oracle-store";

export const dynamic = "force-dynamic";

type StreakClaimRequest = {
  day: number;
};

export async function POST(request: NextRequest) {
  try {
    const ownerId = await getRequestOwnerId();
    const body = (await request.json()) as StreakClaimRequest;

    if (!body.day || body.day < 1 || body.day > 7) {
      return NextResponse.json(
        { error: "Invalid day. Must be between 1 and 7." },
        { status: 400 }
      );
    }

    const result = await claimDailyStreak(ownerId, body.day);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to claim daily reward" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      streak: result.streak,
      coinsEarned: result.coinsEarned,
    });
  } catch (error) {
    console.error("Streak claim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
