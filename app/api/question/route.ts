import { NextRequest, NextResponse } from "next/server";
import playersData from "@/lib/players.json";
import { generateDynamicQuestions } from "@/lib/dynamicQuestions";

// ── Fuzzy answer weights (real Akinator style) ─────
const ANSWER_WEIGHTS: Record<string, { match: number; mismatch: number }> = {
  Yes:            { match: 2.0,  mismatch: -1.0 },
  "Probably Yes": { match: 1.2,  mismatch: -0.5 },
  "Don't Know":   { match: 0,    mismatch: 0 },
  "Probably Not": { match: -0.5, mismatch: 1.2 },
  No:             { match: -1.0, mismatch: 2.0 },
};

const TOTAL = playersData.length;

/** Score every player using fuzzy weighted answers */
function scoreAllPlayers(
  allPlayers: (typeof playersData[0] & { id: number })[],
  allQuestions: ReturnType<typeof generateDynamicQuestions>,
  answerHistory: { question: string; answer: string }[]
) {
  return allPlayers.map(player => {
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
}

/** Shannon entropy: H = -Σ p*log2(p) */
function entropy(probabilities: number[]): number {
  let h = 0;
  for (const p of probabilities) {
    if (p > 0 && p < 1) {
      h -= p * Math.log2(p) + (1 - p) * Math.log2(1 - p);
    }
  }
  return h;
}

/** Calculate information gain for a question against weighted candidates */
function informationGain(
  candidates: { player: (typeof playersData[0] & { id: number }); score: number }[],
  questionFilter: (p: (typeof playersData[0])) => boolean
): number {
  if (candidates.length === 0) return 0;

  // Normalize scores to probabilities
  const minScore = Math.min(...candidates.map(c => c.score));
  const shifted = candidates.map(c => c.score - minScore + 1); // shift to positive
  const total = shifted.reduce((a, b) => a + b, 0);
  const probs = shifted.map(s => s / total);

  // Calculate weighted yes/no split
  let yesWeight = 0;
  let noWeight = 0;
  const yesProbs: number[] = [];
  const noProbs: number[] = [];

  candidates.forEach((c, i) => {
    if (questionFilter(c.player)) {
      yesWeight += probs[i];
      yesProbs.push(probs[i]);
    } else {
      noWeight += probs[i];
      noProbs.push(probs[i]);
    }
  });

  // Skip useless questions (all yes or all no)
  if (yesWeight === 0 || noWeight === 0) return 0;

  // Information gain = how close to 50/50 weighted split
  // Perfect split = maximum entropy reduction
  const balance = 1 - Math.abs(yesWeight - noWeight);
  const coverage = Math.min(yesProbs.length, noProbs.length) / candidates.length;

  return balance * 0.7 + coverage * 0.3;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answerHistory } = body as {
      answerHistory: { question: string; answer: string }[];
    };

    const allPlayers = playersData.map((p, i) => ({ ...p, id: i + 1 }));
    const allQuestions = generateDynamicQuestions(playersData);

    // ── Score all players with fuzzy weights ────────
    const scores = scoreAllPlayers(allPlayers, allQuestions, answerHistory);
    scores.sort((a, b) => b.score - a.score);

    // ── Build candidate pool from top scorers ──────
    const maxScore = scores[0]?.score ?? 0;
    const threshold = Math.max(0, maxScore - 3);
    const candidatePool = scores.filter(s => s.score >= threshold);

    // ── Select question with maximum information gain
    const dynamicQuestions = generateDynamicQuestions(
      candidatePool.length > 1 ? candidatePool.map(c => c.player) : allPlayers
    );

    let bestQuestion = null;
    let bestGain = -Infinity;

    for (const q of dynamicQuestions) {
      if (answerHistory.some(a => a.question === q.text)) continue;

      const gain = informationGain(candidatePool, q.filter);
      if (gain > bestGain) {
        bestGain = gain;
        bestQuestion = q;
      }
    }

    // Fallback
    if (!bestQuestion) {
      bestQuestion =
        dynamicQuestions.find(q => !answerHistory.some(a => a.question === q.text)) ||
        allQuestions.find(q => !answerHistory.some(a => a.question === q.text)) ||
        dynamicQuestions[0];
    }

    // ── Confidence: based on score separation ──────
    const remaining = candidatePool.length;
    const secondScore = scores.length > 1 ? scores[1].score : 0;
    const lead = maxScore - secondScore;
    let confidence: number;
    if (remaining <= 1) {
      confidence = 98;
    } else if (remaining <= 3 && lead >= 3) {
      confidence = 90;
    } else {
      confidence = Math.round(
        Math.min(89, Math.max(5, 100 * (1 - Math.log(remaining) / Math.log(TOTAL)) + lead * 3))
      );
    }

    return NextResponse.json({
      question: bestQuestion?.text ?? "Is your player Indian?",
      confidence,
      topGuess: scores[0]?.player.name ?? "Unknown",
      remainingCandidates: remaining,
      reasoning: `IG: ${bestGain.toFixed(3)} | Lead: +${lead.toFixed(1)}`,
    });
  } catch (error) {
    console.error("Question API error:", error);
    return NextResponse.json({ error: "Failed to parse request" }, { status: 500 });
  }
}
