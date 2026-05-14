"use client";

import React from "react";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-ipl/20 blur-[120px] mix-blend-screen animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gold/15 blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass relative z-10 flex flex-col items-center justify-center p-10 md:p-16 rounded-[2.5rem] border border-white/10 shadow-2xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,112,255,0.1)] max-w-2xl w-full mx-auto"
      >

        {/* Mascot */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        >
          <Mascot state="confident" size="lg" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 font-display text-5xl md:text-7xl font-bold uppercase tracking-wider text-center"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-text-primary to-text-secondary">IPL</span>{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B800] via-[#FFE270] to-[#F5B800] bg-[length:200%_auto] animate-text-gradient drop-shadow-lg">Akinator</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6 font-body text-lg md:text-xl text-text-secondary text-center max-w-md"
        >
          Think of an <span className="font-semibold text-white">IPL Player</span>.<br className="hidden md:block" />
          <span className="text-glow font-medium drop-shadow-[0_0_10px_rgba(0,194,255,0.8)]">I&apos;ll figure out who it is.</span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12"
        >
          <Link
            href="/game"
            id="cta-challenge"
            className="group relative inline-flex items-center gap-4 px-10 py-5 rounded-pill bg-gradient-to-r from-[#F5B800] to-[#D49E00] text-stadium font-display text-xl md:text-2xl font-bold uppercase tracking-widest overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_20px_rgba(245,184,0,0.3)] hover:shadow-[0_0_40px_rgba(245,184,0,0.5)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-pill"></div>
            <span className="relative z-10 text-2xl group-hover:-rotate-12 transition-transform duration-300">🏏</span>
            <span className="relative z-10 drop-shadow-md">Challenge Me</span>
            <div className="absolute inset-0 -translate-x-[150%] skew-x-[-20deg] group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </Link>
        </motion.div>

        {/* Info tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-12 pt-8 border-t border-white/5 w-full text-center"
        >
          <p className="font-mono text-xs md:text-sm text-text-secondary/70 uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-glow shadow-[0_0_10px_rgba(0,194,255,0.8)] animate-pulse"></span>
            Powered by Gemini AI
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
