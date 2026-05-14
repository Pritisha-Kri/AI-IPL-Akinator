"use client";

import React from "react";
import { motion } from "framer-motion";

interface PlayerCardProps {
  name: string;
  role: string;
  team: string;
  nationality: string;
  confidence: number;
  isRevealed: boolean;
}

export default function PlayerCard({
  name,
  role,
  team,
  nationality,
  confidence,
  isRevealed,
}: PlayerCardProps) {
  const roleEmojis: Record<string, string> = {
    Batsman: "🏏",
    Bowler: "🎯",
    "All-rounder": "⚡",
    Wicketkeeper: "🧤",
  };

  return (
    <div className="perspective-[1000px] w-80 h-[28rem] mx-auto">
      <motion.div
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 1, type: "spring", stiffness: 60, damping: 15 }}
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front — Mystery */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] glass border border-white/5 shadow-2xl overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-[2.5rem] pointer-events-none" />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
              boxShadow: ["0 0 20px rgba(255,107,53,0.1)", "0 0 60px rgba(255,107,53,0.3)", "0 0 20px rgba(255,107,53,0.1)"] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 rounded-full flex items-center justify-center bg-surface/50 border-2 border-primary/20 text-6xl mb-8"
          >
            👤
          </motion.div>
          <p className="font-display text-xl font-black text-text-secondary uppercase tracking-[0.3em]">Analyzing Target</p>
          <div className="mt-4 flex gap-1">
            {[1,2,3].map(i => (
              <motion.div 
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>

        {/* Back — Player Reveal */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-start py-10 rounded-[2.5rem] glass-primary border border-primary/30 overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Background spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={isRevealed ? { scale: 1 } : { scale: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            className="relative w-32 h-32 rounded-full bg-surface border-4 border-primary flex items-center justify-center text-6xl mb-8 z-10 shadow-primary"
          >
            {roleEmojis[role] || "🏏"}
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.6 }}
            className="relative z-10 font-display text-4xl font-black text-white uppercase tracking-tighter text-center leading-none px-6"
          >
            {name}
          </motion.h2>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={isRevealed ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.7 }}
            className="relative z-10 mt-10 space-y-3 w-full px-10"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="font-body text-xs text-text-secondary uppercase tracking-widest">Role</span>
               <span className="font-body text-sm text-white font-bold">{role}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="font-body text-xs text-text-secondary uppercase tracking-widest">Team</span>
               <span className="font-body text-sm text-white font-bold">{team}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="font-body text-xs text-text-secondary uppercase tracking-widest">Origin</span>
               <span className="font-body text-sm text-white font-bold">{nationality}</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isRevealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.9 }}
            className="relative z-10 mt-auto px-8 py-3 rounded-xl bg-primary text-stadium font-display text-sm font-black uppercase tracking-widest"
          >
            {Math.round(confidence)}% Probability
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
