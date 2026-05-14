import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import playersData from "@/lib/players.json";
import { generateDynamicQuestions, Player } from "@/lib/dynamicQuestions";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Structured output schema (minimal) ──────────────
const turnResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    top_candidates: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
        },
        required: ["name", "confidence"],
      },
    },
    confidence_score: { type: SchemaType.NUMBER },
    make_guess: { type: SchemaType.BOOLEAN },
    final_guess: { type: SchemaType.STRING },
    next_question: { type: SchemaType.STRING },
    reasoning: { type: SchemaType.STRING },
  },
  required: ["top_candidates", "confidence_score", "make_guess", "final_guess", "next_question", "reasoning"],
};

// ── Fuzzy answer weights for local filtering ────────
const ANSWER_WEIGHTS: Record<string, { match: number; mismatch: number }> = {
  Yes:            { match: 2.0,  mismatch: -1.0 },
  "Probably Yes": { match: 1.2,  mismatch: -0.5 },
  "Don't Know":   { match: 0,    mismatch: 0 },
  "Probably Not": { match: -0.5, mismatch: 1.2 },
  No:             { match: -1.0, mismatch: 2.0 },
};

// ── STEP 1: Local pre-filtering (no API call) ───────
export function localFilter(
  answerHistory: { question: string; answer: string }[]
): { player: typeof playersData[0]; score: number }[] {
  const allQuestions = generateDynamicQuestions(playersData as Player[]);

  const scores = playersData.map(player => {
    let score = 0;
    for (const entry of answerHistory) {
      const q = allQuestions.find(q => q.text === entry.question);
      if (!q) continue;
      const matches = q.filter(player as Player);
      const w = ANSWER_WEIGHTS[entry.answer] ?? { match: 0, mismatch: 0 };
      score += matches ? w.match : w.mismatch;
    }
    return { player, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

// ── STEP 2: Compress history (80% token reduction) ──
function compressHistory(
  answerHistory: { question: string; answer: string }[]
): string {
  if (answerHistory.length === 0) return "No questions asked yet.";
  return answerHistory
    .map((e, i) => `${i + 1}. ${e.question} → ${e.answer}`)
    .join("\n");
}

// ── STEP 3: Build minimal prompt ────────────────────
function buildPrompt(
  filteredNames: string[],
  history: string,
  questionCount: number
): string {
  return `You are the IPL Akinator. Guess which IPL player (2008-2026) the user is thinking of.

REMAINING CANDIDATES (${filteredNames.length} players):
${filteredNames.join(", ")}

QUESTION-ANSWER HISTORY:
${history}

Questions asked: ${questionCount}

RULES:
- If confidence >= 80% OR questions >= 8: set make_guess=true, put player name in final_guess
- Otherwise: ask the BEST next question that splits the remaining candidates closest to 50/50
- The question must be answerable with Yes/Probably Yes/Don't Know/Probably Not/No
- Return top 5 candidates with confidence scores
- NEVER repeat a question from history
- Focus on: nationality, role, team, batting style, era, captaincy, awards, personality`;
}

const SYSTEM_INSTRUCTION = `You are an expert IPL cricket knowledge engine. You know every IPL player from 2008 to 2026.
Your job: guess the player the user is thinking of by asking smart binary questions.
Pick questions that divide the candidate pool in half. Be decisive when confident.
Always return valid JSON matching the schema.`;

// ── STEP 4: Call Gemini with retry ──────────────────
async function callGemini(prompt: string, retries = 2): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
      responseSchema: turnResponseSchema,
    } as any,
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (err: any) {
      const is429 = err?.message?.includes("429") || err?.status === 429;
      if (is429 && attempt < retries) {
        const delay = (attempt + 1) * 2000;
        console.warn(`[Gemini] Rate limited, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

// ── Hardcoded first question (saves 1 API call) ─────
const FIRST_QUESTION = "Is your player an Indian cricketer?";

// ── Public API ──────────────────────────────────────
export interface TurnResult {
  top_candidates: { name: string; confidence: number }[];
  confidence_score: number;
  make_guess: boolean;
  final_guess: string;
  next_question: string;
  reasoning: string;
}

export async function executeTurn(
  answerHistory: { question: string; answer: string }[]
): Promise<TurnResult> {
  const questionCount = answerHistory.length;

  // ── Turn 0: Hardcoded first question ─────────────
  if (questionCount === 0) {
    return {
      top_candidates: [
        { name: "MS Dhoni", confidence: 5 },
        { name: "Virat Kohli", confidence: 5 },
        { name: "Rohit Sharma", confidence: 5 },
        { name: "AB de Villiers", confidence: 5 },
        { name: "Jasprit Bumrah", confidence: 5 },
      ],
      confidence_score: 0,
      make_guess: false,
      final_guess: "",
      next_question: FIRST_QUESTION,
      reasoning: "Starting game — first question splits pool ~65/35 (Indian vs Overseas)",
    };
  }

  // ── Local pre-filtering ──────────────────────────
  const scores = localFilter(answerHistory);

  // Top 30 player names (token-efficient)
  const topNames = scores.slice(0, 30).map(s => s.player.name);

  // If only 1-2 left locally, guess immediately (no API call needed)
  const maxScore = scores[0].score;
  const secondScore = scores.length > 1 ? scores[1].score : -999;
  const lead = maxScore - secondScore;

  if (lead >= 6 && questionCount >= 5) {
    const best = scores[0].player;
    return {
      top_candidates: scores.slice(0, 5).map(s => ({
        name: s.player.name,
        confidence: Math.round(Math.max(0, Math.min(99, 50 + s.score * 5))),
      })),
      confidence_score: 95,
      make_guess: true,
      final_guess: best.name,
      next_question: "",
      reasoning: `Local algorithm: ${best.name} has a lead of +${lead.toFixed(1)} over runner-up. High confidence guess.`,
    };
  }

  // ── Compressed prompt to Gemini ──────────────────
  const history = compressHistory(answerHistory);
  const prompt = buildPrompt(topNames, history, questionCount);

  const result = await callGemini(prompt);
  return result as TurnResult;
}
