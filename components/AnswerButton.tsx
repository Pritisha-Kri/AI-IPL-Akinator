"use client";

import React from "react";
import { motion } from "framer-motion";

type AnswerType = "yes" | "probyes" | "dontknow" | "probno" | "no";

interface AnswerButtonProps {
  type: AnswerType;
  onClick: () => void;
  disabled?: boolean;
}

const config: Record<AnswerType, { label: string; emoji: string }> = {
  yes: { label: "Yes", emoji: "✅" },
  probyes: { label: "Probably", emoji: "👍" },
  dontknow: { label: "Don't Know", emoji: "🤷" },
  probno: { label: "Probably Not", emoji: "👎" },
  no: { label: "No", emoji: "❌" },
};

export default function AnswerButton({ type, onClick, disabled }: AnswerButtonProps) {
  const { label, emoji } = config[type];

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, backgroundColor: "rgba(255, 107, 53, 0.1)", borderColor: "#FF6B35" } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full flex flex-col items-center justify-center p-6 gap-3 rounded-2xl
        transition-all duration-300 border border-white/5 bg-surface/40
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer group hover:shadow-primary"}
      `}
    >
      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{emoji}</span>
      <span className="font-display text-sm font-bold uppercase tracking-widest text-text-secondary group-hover:text-white transition-colors text-center">
        {label}
      </span>
      
      {/* Subtle indicator line */}
      <div className="absolute bottom-3 w-4 h-1 rounded-full bg-white/5 group-hover:bg-primary group-hover:w-8 transition-all duration-300"></div>
    </motion.button>
  );
}
