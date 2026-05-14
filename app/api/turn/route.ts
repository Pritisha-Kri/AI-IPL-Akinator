import { NextRequest, NextResponse } from "next/server";
import playersData from "@/lib/players.json";
import { generateDynamicQuestions, Player } from "@/lib/dynamicQuestions";

// ── Fuzzy answer weights ────────────────────────────
const WEIGHTS: Record<string, { match: number; mismatch: number }> = {
  Yes:            { match: 2.0,  mismatch: -1.0 },
  "Probably Yes": { match: 1.2,  mismatch: -0.5 },
  "Don't Know":   { match: 0,    mismatch: 0 },
  "Probably Not": { match: -0.5, mismatch: 1.2 },
  No:             { match: -1.0, mismatch: 2.0 },
};

// Hardcoded first question — instant, saves API call, splits pool ~65/35
const FIRST_QUESTION = "Is your player Indian?";

type ScoredPlayer = { player: typeof playersData[0] & { id: number }; score: number };

/** Score all players using fuzzy weighted answer history */
function scoreAll(
  history: { question: string; answer: string }[]
): ScoredPlayer[] {
  const allPlayers = playersData.map((p, i) => ({ ...p, id: i + 1 }));
  const allQuestions = generateDynamicQuestions(playersData as Player[]);

  const scores: ScoredPlayer[] = allPlayers.map(player => {
    let score = 0;
    for (const entry of history) {
      const q = allQuestions.find(q => q.text === entry.question);
      if (!q) continue;
      const matches = q.filter(player as Player);
      const w = WEIGHTS[entry.answer] ?? { match: 0, mismatch: 0 };
      score += matches ? w.match : w.mismatch;
    }
    return { player, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

/** Information gain: how well a question splits the weighted pool */
function infoGain(
  pool: ScoredPlayer[],
  filter: (p: Player) => boolean
): number {
  if (pool.length <= 1) return 0;

  const minScore = Math.min(...pool.map(c => c.score));
  const shifted = pool.map(c => c.score - minScore + 1);
  const total = shifted.reduce((a, b) => a + b, 0);

  let yesW = 0, noW = 0, yesN = 0, noN = 0;
  pool.forEach((c, i) => {
    const w = shifted[i] / total;
    if (filter(c.player as Player)) { yesW += w; yesN++; }
    else { noW += w; noN++; }
  });

  if (yesN === 0 || noN === 0) return 0;

  // Balance (closer to 50/50 = better) + coverage
  const balance = 1 - Math.abs(yesW - noW);
  const coverage = Math.min(yesN, noN) / pool.length;
  return balance * 0.7 + coverage * 0.3;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answerHistory } = body as {
      answerHistory: { question: string; answer: string }[];
    };

    const history = answerHistory ?? [];
    const questionCount = history.length;

    // ── Turn 0: Hardcoded first question (instant) ──
    if (questionCount === 0) {
      return NextResponse.json({
        make_guess: false,
        question: FIRST_QUESTION,
        confidence: 0,
        guessedPlayerName: "",
        guessedPlayerId: 0,
        playerDetails: { role: "", team: "", nationality: "" },
        topCandidates: [
          { name: "MS Dhoni", confidence: 5 },
          { name: "Virat Kohli", confidence: 5 },
          { name: "Rohit Sharma", confidence: 5 },
          { name: "AB de Villiers", confidence: 5 },
          { name: "Jasprit Bumrah", confidence: 5 },
        ],
        reasoning: "Game started — first question is now connected to the scoring engine",
        remainingCandidates: playersData.length,
      });
    }

    // ── Score all players ───────────────────────────
    const scores = scoreAll(history);
    const best = scores[0];
    const second = scores.length > 1 ? scores[1] : null;
    const lead = best.score - (second?.score ?? -999);
    const maxPossible = questionCount * 2;
    const scoreRatio = maxPossible > 0 ? best.score / maxPossible : 0;

    // ── Top candidates for display ──────────────────
    const topCandidates = scores.slice(0, 5).map(s => ({
      name: s.player.name,
      confidence: Math.round(Math.max(0, Math.min(99,
        maxPossible > 0 ? (s.score / maxPossible) * 100 : 5
      ))),
    }));

    // ── Confidence calculation ──────────────────────
    let confidence: number;
    if (maxPossible === 0) {
      confidence = 0;
    } else {
      const basePct = scoreRatio * 65;
      const leadPct = Math.min(33, lead * 4);
      confidence = Math.round(Math.min(99, Math.max(5, basePct + leadPct)));
    }
    if (best.score === maxPossible && maxPossible >= 10) confidence = 99;

    // ── Should we guess? ────────────────────────────
    const shouldGuess =
      (confidence >= 88 && questionCount >= 10) ||
      questionCount >= 16 ||
      (lead >= 7.5 && questionCount >= 9);

    if (shouldGuess) {
      const p = best.player;
      return NextResponse.json({
        make_guess: true,
        question: "",
        confidence,
        guessedPlayerName: p.name,
        guessedPlayerId: p.id,
        playerDetails: {
          role: p.role,
          team: (p as any).attributes?.primaryTeam ?? p.teams?.[0] ?? "Unknown",
          nationality: p.nationality,
        },
        topCandidates,
        reasoning: `Score: ${best.score.toFixed(1)}/${maxPossible} | Lead: +${lead.toFixed(1)} over ${second?.player.name ?? "N/A"}`,
        remainingCandidates: scores.filter(s => s.score >= best.score - 1.5).length,
      });
    }

    // ── Select next question (entropy-based) ────────
    const threshold = Math.max(0, best.score - 1.5);
    const candidatePool = scores.filter(s => s.score >= threshold);

    const dynamicQuestions = generateDynamicQuestions(
      candidatePool.length > 1 ? candidatePool.map(c => c.player) as Player[] : playersData as Player[]
    );

    let bestQuestion = null;
    let bestGain = -Infinity;

    for (const q of dynamicQuestions) {
      if (history.some(a => a.question === q.text)) continue;
      const gain = infoGain(candidatePool, q.filter);
      if (gain > bestGain) {
        bestGain = gain;
        bestQuestion = q;
      }
    }

    // Fallback
    if (!bestQuestion) {
      const allQuestions = generateDynamicQuestions(playersData as Player[]);
      bestQuestion = allQuestions.find(q => !history.some(a => a.question === q.text)) ?? allQuestions[0];
    }

    return NextResponse.json({
      make_guess: false,
      question: bestQuestion?.text ?? "Has your player won an IPL title?",
      confidence,
      guessedPlayerName: "",
      guessedPlayerId: 0,
      playerDetails: { role: "", team: "", nationality: "" },
      topCandidates,
      reasoning: `IG: ${bestGain.toFixed(3)} | Pool: ${candidatePool.length} | Top: ${best.player.name} (${best.score.toFixed(1)})`,
      remainingCandidates: candidatePool.length,
    });
  } catch (error: any) {
    console.error("Turn API error:", error?.message);
    return NextResponse.json(
      { error: "TURN_FAILED", message: error?.message || "Failed to execute turn" },
      { status: 500 }
    );
  }
}
