import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FEEDBACK_FILE = path.join(process.cwd(), "lib", "feedback.json");

/** Load existing feedback or create empty array */
function loadFeedback(): unknown[] {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      return JSON.parse(fs.readFileSync(FEEDBACK_FILE, "utf8"));
    }
  } catch { /* ignore parse errors */ }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actualPlayer, answerHistory, guessedPlayer } = body as {
      actualPlayer: string;
      answerHistory?: { question: string; answer: string }[];
      guessedPlayer?: string;
    };

    if (!actualPlayer || actualPlayer.trim().length === 0) {
      return NextResponse.json(
        { error: "Player name is required" },
        { status: 400 }
      );
    }

    // ── Persist feedback for learning ───────────────
    const feedback = loadFeedback();
    feedback.push({
      timestamp: new Date().toISOString(),
      actualPlayer: actualPlayer.trim(),
      guessedPlayer: guessedPlayer ?? null,
      wasCorrect: false,
      answerHistory: answerHistory ?? [],
    });

    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedback, null, 2));

    console.log(
      `[Feedback] Guessed: ${guessedPlayer} → Actual: ${actualPlayer} | ${answerHistory?.length ?? 0} answers saved`
    );

    return NextResponse.json({
      success: true,
      message: "Feedback saved. I'll learn from this!",
      totalFeedback: feedback.length,
    });
  } catch (error) {
    console.error("Feedback save error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
