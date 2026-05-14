"use client";

import React from "react";
import { motion } from "framer-motion";

type MascotState = "thinking" | "confident" | "triumphant" | "surprised";

interface MascotProps {
  state: MascotState;
  size?: "sm" | "md" | "lg";
}

const mascotConfig: Record<MascotState, { emoji: string; label: string }> = {
  thinking: {
    emoji: "🧞",
    label: "Hmm, let me think...",
  },
  confident: {
    emoji: "🧞‍♂️",
    label: "I think I know...",
  },
  triumphant: {
    emoji: "🏆",
    label: "I've got it!",
  },
  surprised: {
    emoji: "😮",
    label: "Oh! Interesting...",
  },
};

const sizeClasses = {
  sm: "w-16 h-16 text-3xl",
  md: "w-24 h-24 text-5xl",
  lg: "w-32 h-32 text-7xl",
};

export default function Mascot({ state, size = "md" }: MascotProps) {
  const { emoji, label } = mascotConfig[state];

  const getAnimation = () => {
    switch (state) {
      case "thinking":
        return { 
          y: [0, -10, 0],
          boxShadow: [
            "0 0 20px rgba(255, 107, 53, 0.1)",
            "0 0 40px rgba(255, 107, 53, 0.2)",
            "0 0 20px rgba(255, 107, 53, 0.1)"
          ]
        };
      case "confident":
        return { 
          scale: [1, 1.05, 1], 
          boxShadow: [
            "0 0 20px rgba(255, 107, 53, 0.2)", 
            "0 0 60px rgba(255, 107, 53, 0.5)", 
            "0 0 20px rgba(255, 107, 53, 0.2)"
          ] 
        };
      case "triumphant":
        return { 
          y: [0, -15, 0], 
          rotate: [0, -10, 10, -10, 0],
          boxShadow: [
            "0 0 30px rgba(255, 107, 53, 0.3)",
            "0 0 80px rgba(255, 107, 53, 0.6)",
            "0 0 30px rgba(255, 107, 53, 0.3)"
          ]
        };
      case "surprised":
        return { 
          scale: [1, 1.2, 1],
          boxShadow: "0 0 40px rgba(255, 107, 53, 0.4)"
        };
      default:
        return {};
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={getAnimation()}
        transition={{
          duration: state === "thinking" ? 2 : state === "confident" ? 3 : 1,
          repeat: state === "thinking" || state === "confident" ? Infinity : 0,
          ease: "easeInOut",
        }}
        className={`
          ${sizeClasses[size]}
          rounded-full bg-surface flex items-center justify-center
          transition-all duration-500
          border-4 border-primary/20
          relative overflow-hidden
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-50"></div>
        <span className="relative z-10 select-none filter drop-shadow-lg">{emoji}</span>
      </motion.div>
      <motion.p 
        key={label}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-body text-sm text-text-secondary italic font-medium uppercase tracking-widest"
      >
        {label}
      </motion.p>
    </div>
  );
}
