import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { players } from "./schema";
import playerData from "./players.json";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Please configure .env.local");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("🏏 Seeding IPL player data...");

  for (const player of playerData) {
    await db.insert(players).values({
      name: player.name,
      nationality: player.nationality,
      role: player.role,
      teams: player.teams,
      seasons: player.seasons,
      isCaptain: player.isCaptain,
      awards: player.awards,
      attributes: player.attributes,
    });
    console.log(`  ✅ ${player.name}`);
  }

  console.log(`\n🎉 Seeded ${playerData.length} players successfully!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
