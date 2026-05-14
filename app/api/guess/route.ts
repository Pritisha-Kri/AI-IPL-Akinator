import { NextRequest, NextResponse } from "next/server";
import playersData from "@/lib/players.json";
import { generateDynamicQuestions } from "@/lib/dynamicQuestions";

// ── Same fuzzy weights as question route ────────────
const ANSWER_WEIGHTS: Record<string, { match: number; mismatch: number }> = {
  Yes:            { match: 2.0,  mismatch: -1.0 },
  "Probably Yes": { match: 1.2,  mismatch: -0.5 },
  "Don't Know":   { match: 0,    mismatch: 0 },
  "Probably Not": { match: -0.5, mismatch: 1.2 },
  No:             { match: -1.0, mismatch: 2.0 },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answerHistory } = body as {
      answerHistory: { question: string; answer: string }[];
    };

    const allPlayers = playersData.map((p, index) => ({ ...p, id: index + 1 }));
    const allQuestions = generateDynamicQuestions(playersData);

    // ── Score every player with fuzzy weights ──────
    const scores = allPlayers.map(player => {
      let score = 0;
      for (const entry of answerHistory) {
        const q = allQuestions.find(q => q.text === entry.question);
        if (!q) continue;
        const matches = q.filter(player);
        const w = ANSWER_WEIGHTS[entry.answer] ?? { match: 0, mismatch: 0 };
        score += matches ? w.match : w.mismatch;
      }
      return { player, score };
    });

    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    const maxPossible = answerHistory.length * 2;
    const secondScore = scores.length > 1 ? scores[1].score : 0;
    const lead = best.score - secondScore;
    const scoreRatio = maxPossible > 0 ? best.score / maxPossible : 0;

    // ── Confidence from match ratio + lead ─────────
    let confidence: number;
    if (maxPossible === 0) {
      confidence = 0;
    } else {
      const basePct = scoreRatio * 65;
      const leadPct = Math.min(33, lead * 4);
      confidence = Math.round(Math.min(99, Math.max(15, basePct + leadPct)));
    }
    if (best.score === maxPossible && maxPossible >= 10) confidence = 99;

    return NextResponse.json({
      guessedPlayerId: best.player.id || 1,
      guessedPlayerName: best.player.name,
      confidence,
      reasoning: `Score: ${best.score.toFixed(1)}/${maxPossible} | Lead: +${lead.toFixed(1)} | #2: ${scores[1]?.player.name ?? "N/A"}`,
      playerDetails: {
        role: best.player.role,
        team: best.player.teams?.length > 0 ? best.player.teams[0] : "Unknown",
        nationality: best.player.nationality,
      },
    });
  } catch (error) {
    console.error("Guess API error:", error);
    return NextResponse.json({ error: "Failed to parse request" }, { status: 500 });
  }
}
