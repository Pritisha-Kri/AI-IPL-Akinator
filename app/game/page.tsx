"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import AnswerButton from "@/components/AnswerButton";
import ProgressBar from "@/components/ProgressBar";
import PlayerCard from "@/components/PlayerCard";
import { motion, AnimatePresence } from "framer-motion";

const MAX_QUESTIONS = 20;

type GamePhase = "loading" | "questioning" | "guessing" | "reveal" | "feedback";

interface AnswerEntry {
  question: string;
  answer: string;
}

interface TopCandidate {
  name: string;
  confidence: number;
  reasoning: string;
}

interface TurnResponse {
  make_guess: boolean;
  question: string;
  confidence: number;
  guessedPlayerName: string;
  playerDetails: { role: string; team: string; nationality: string };
  topCandidates: TopCandidate[];
  reasoning: string;
}

export default function GamePage() {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [answerHistory, setAnswerHistory] = useState<AnswerEntry[]>([]);
  const [guess, setGuess] = useState<TurnResponse | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topCandidates, setTopCandidates] = useState<TopCandidate[]>([]);
  const [reasoning, setReasoning] = useState("");

  // ── Unified turn handler ──────────────────────────
  const executeTurn = useCallback(
    async (history: AnswerEntry[]) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answerHistory: history }),
        });

        const data: TurnResponse = await res.json();

        if (!res.ok) {
          const errMsg = (data as any).error === "API_QUOTA_EXCEEDED"
            ? "AI is thinking deeply... Please wait a moment."
            : ((data as any).message || "Turn failed");
          setError(errMsg);
          setPhase("questioning");
          setIsLoading(false);
          return;
        }

        setConfidence(data.confidence);
        setTopCandidates(data.topCandidates ?? []);
        setReasoning(data.reasoning ?? "");

        if (data.make_guess) {
          setGuess(data);
          setPhase("guessing");
          setTimeout(() => {
            setPhase("reveal");
            setTimeout(() => setIsRevealed(true), 800);
          }, 2500); 
        } else {
          setCurrentQuestion(data.question);
          setPhase("questioning");
        }
      } catch (err: any) {
        setError(err.message || "Failed to process turn.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const startGame = () => {
    setQuestionNumber(1);
    executeTurn([]);
  };

  const handleAnswer = async (answer: string) => {
    const newEntry: AnswerEntry = { question: currentQuestion, answer };
    const newHistory = [...answerHistory, newEntry];
    const newQuestionNum = questionNumber + 1;

    setAnswerHistory(newHistory);
    setQuestionNumber(newQuestionNum);

    await executeTurn(newHistory);
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualPlayer: feedbackText.trim(),
          answerHistory,
          guessedPlayer: guess?.guessedPlayerName ?? null,
        }),
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const resetGame = () => {
    setPhase("loading");
    setAnswerHistory([]);
    setQuestionNumber(0);
    setConfidence(0);
    setGuess(null);
    setIsRevealed(false);
    setTopCandidates([]);
    setReasoning("");
    setFeedbackText("");
    setFeedbackSent(false);
    setError(null);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const renderPhase = () => {
    switch (phase) {
      case "loading":
        return (
          <motion.div key="loading" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center px-4 text-center max-w-xl mx-auto">
            <Mascot state="thinking" size="lg" />
            <h2 className="mt-10 font-display text-4xl font-black text-white uppercase tracking-tighter leading-none">The Arena Awaits</h2>
            <p className="mt-4 font-body text-lg text-text-secondary leading-relaxed">
              Think of any IPL star. I will use the power of AI to unmask your thought.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="mt-12 px-14 py-6 rounded-2xl bg-primary text-stadium font-display text-2xl font-black uppercase tracking-widest shadow-primary"
            >
              Start Game
            </motion.button>
          </motion.div>
        );

      case "questioning":
        return (
          <motion.div key="questioning" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-start w-full max-w-5xl px-4 py-12 gap-10">
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 px-4">
              <div className="flex flex-col gap-1">
                <span className="font-display text-3xl font-black text-white uppercase">Step {questionNumber}</span>
                <span className="font-body text-sm text-text-secondary uppercase tracking-widest">Akinator is analyzing...</span>
              </div>
              <div className="flex-1 max-w-md w-full">
                <ProgressBar
                  currentQuestion={questionNumber}
                  maxQuestions={MAX_QUESTIONS}
                  confidence={confidence}
                />
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row items-stretch gap-8 w-full">
              <motion.div variants={itemVariants} className="flex-shrink-0 flex flex-col items-center justify-center p-8 glass rounded-[2rem] border border-white/5 lg:w-72">
                <Mascot state={confidence > 60 ? "confident" : "thinking"} size="lg" />
              </motion.div>

              <div className="flex flex-col gap-8 w-full">
                <motion.div 
                  variants={itemVariants} 
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-[2rem] p-10 md:p-14 w-full relative overflow-hidden border border-white/10"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                  <p className="font-body text-2xl md:text-4xl font-bold text-white leading-tight">
                    &ldquo;{currentQuestion}&rdquo;
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
                   <AnswerButton type="yes" onClick={() => handleAnswer("Yes")} disabled={isLoading} />
                   <AnswerButton type="no" onClick={() => handleAnswer("No")} disabled={isLoading} />
                   <AnswerButton type="probyes" onClick={() => handleAnswer("Probably Yes")} disabled={isLoading} />
                   <AnswerButton type="probno" onClick={() => handleAnswer("Probably Not")} disabled={isLoading} />
                   <AnswerButton type="dontknow" onClick={() => handleAnswer("Don't Know")} disabled={isLoading} />
                </motion.div>

                <AnimatePresence mode="wait">
                  {isLoading && (
                    <motion.div 
                      key="loader"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-xl border border-primary/20 self-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                      <span className="font-mono text-sm text-primary font-bold uppercase tracking-widest">Reasoning...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        );

      case "guessing":
        return (
          <motion.div key="guessing" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center px-4 text-center">
            <Mascot state="confident" size="lg" />
            <motion.h2 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mt-10 font-display text-4xl md:text-6xl font-black text-primary uppercase"
            >
              Target Acquired
            </motion.h2>
            <p className="mt-4 font-mono text-lg text-text-secondary uppercase tracking-[0.3em]">Calculating Match: {confidence}%</p>
          </motion.div>
        );

      case "reveal":
        return (
          <motion.div key="reveal" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center px-4 text-center py-10 w-full max-w-4xl mx-auto">
            <div className="mb-10">
              <Mascot state="triumphant" size="lg" />
            </div>

            <h2 className="font-display text-2xl text-text-secondary uppercase tracking-[0.5em] mb-10">Reveal Complete</h2>

            <div className="w-full mb-12">
              <PlayerCard
                name={guess!.guessedPlayerName}
                role={guess!.playerDetails?.role ?? "Unknown"}
                team={guess!.playerDetails?.team ?? "Unknown"}
                nationality={guess!.playerDetails?.nationality ?? "Unknown"}
                confidence={guess!.confidence}
                isRevealed={isRevealed}
              />
            </div>

            <AnimatePresence>
              {isRevealed && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10 w-full"
                >
                  <p className="font-display text-3xl font-black text-white uppercase tracking-tight">Was my analysis correct?</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-6">
                    <button
                      onClick={resetGame}
                      className="px-10 py-5 rounded-2xl bg-primary text-stadium font-display text-xl font-black uppercase tracking-widest shadow-primary"
                    >
                      Correct Analysis
                    </button>
                    <button
                      onClick={() => setPhase("feedback")}
                      className="px-10 py-5 rounded-2xl border-2 border-primary text-primary font-display text-xl font-black uppercase tracking-widest hover:bg-primary/5 transition-colors"
                    >
                      False Result
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case "feedback":
        return (
          <motion.div key="feedback" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center px-4 text-center gap-10 max-w-lg mx-auto">
            <Mascot state="surprised" size="lg" />

            {!feedbackSent ? (
              <div className="space-y-8 w-full">
                <h2 className="font-display text-4xl font-black text-white uppercase tracking-tight">Anomaly Detected</h2>
                <p className="font-body text-text-secondary">Please identify the player so I can optimize my neural network.</p>
                <input
                  type="text"
                  placeholder="Enter player name..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-8 py-5 rounded-2xl glass border border-white/10 text-text-primary font-body text-lg focus:outline-none focus:border-primary transition-all"
                />
                <button
                  onClick={submitFeedback}
                  className="w-full px-10 py-5 rounded-2xl bg-primary text-stadium font-display text-xl font-black uppercase tracking-widest shadow-primary"
                >
                  Update Database
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <h2 className="font-display text-4xl font-black text-success uppercase tracking-tight">System Optimized</h2>
                <p className="font-body text-lg text-text-secondary leading-relaxed">Your input has been successfully processed. I will be more precise in the next iteration.</p>
                <button
                  onClick={resetGame}
                  className="mt-6 px-12 py-5 rounded-2xl bg-white text-stadium font-display text-xl font-black uppercase tracking-widest"
                >
                  New Challenge
                </button>
              </div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center w-full py-20">
      <AnimatePresence mode="wait">
        {renderPhase()}
      </AnimatePresence>
    </main>
  );
}
