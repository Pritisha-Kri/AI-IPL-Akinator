import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  real,
  uuid,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ── Players Table ───────────────────────────────────
// Core IPL player dataset used as the AI's knowledge base
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nationality: text("nationality").notNull(),       // 'Indian' | 'Overseas'
  role: text("role").notNull(),                     // 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper'
  teams: text("teams").array().notNull(),           // ['CSK', 'MI', ...]
  seasons: integer("seasons").array().notNull(),    // [2008, 2009, ...]
  isCaptain: boolean("is_captain").default(false),
  awards: text("awards").array(),                   // ['Orange Cap', 'Purple Cap', ...]
  attributes: jsonb("attributes"),                  // Flexible extra stats (batting avg, economy, etc.)
});

// ── Sessions Table ──────────────────────────────────
// Tracks each game session's state and outcome
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"),
  answers: jsonb("answers").notNull(),              // [{question, answer, timestamp}]
  candidateIds: integer("candidate_ids").array(),   // Current narrowed player pool
  confidence: real("confidence").default(0),
  finalGuess: integer("final_guess").references(() => players.id),
  wasCorrect: boolean("was_correct"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Feedback Table ──────────────────────────────────
// Logs corrections when the AI guesses wrong — used for learning
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id),
  actualPlayer: text("actual_player"),              // What the user said the correct answer was
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Type Exports ────────────────────────────────────
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
