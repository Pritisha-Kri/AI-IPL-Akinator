"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  currentQuestion: number;
  maxQuestions: number;
  confidence: number;
}

export default function ProgressBar({ currentQuestion, maxQuestions, confidence }: ProgressBarProps) {
  const progressPercent = (currentQuestion / maxQuestions) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Progress track */}
      <div className="relative w-full h-3 bg-surface rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-primary to-[#FFB38E] rounded-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </motion.div>
      </div>

      {/* Confidence meter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden border border-white/5 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(confidence, 100)}%` }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="h-full bg-primary shadow-primary rounded-full"
          />
        </div>
        <motion.div 
          key={confidence}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-xs font-bold text-primary uppercase tracking-widest whitespace-nowrap"
        >
          {Math.round(confidence)}% Confidence
        </motion.div>
      </div>
    </div>
  );
}
