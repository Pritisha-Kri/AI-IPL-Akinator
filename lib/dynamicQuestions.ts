export interface Player {
  id?: number;
  name: string;
  nationality: string;
  role: string;
  teams: string[];
  seasons: number[];
  isCaptain: boolean;
  awards: string[];
  attributes?: Record<string, unknown>;
}

type Question = { text: string; filter: (p: Player) => boolean };

/** Helper: get a string attribute safely */
const str = (p: Player, key: string): string => (p.attributes?.[key] as string) ?? "";
const num = (p: Player, key: string): number => (p.attributes?.[key] as number) ?? 0;
const bool = (p: Player, key: string): boolean => (p.attributes?.[key] as boolean) ?? false;

/** Collect unique non-empty values for a string attribute */
function collectUnique(candidates: Player[], key: string, exclude?: string[]): Set<string> {
  const set = new Set<string>();
  candidates.forEach(p => {
    const v = str(p, key);
    if (v && !(exclude ?? []).includes(v)) set.add(v);
  });
  return set;
}

export function generateDynamicQuestions(candidates: Player[]): Question[] {
  const questions: Question[] = [];

  // ── Team questions ────────────────────────────────
  const teams = new Set<string>();
  candidates.forEach(p => p.teams?.forEach(t => teams.add(t)));
  teams.forEach(team => {
    questions.push({ text: `Has your player ever played for ${team}?`, filter: p => p.teams?.includes(team) || false });
  });

  // ── Primary team ──────────────────────────────────
  collectUnique(candidates, "primaryTeam").forEach(team => {
    questions.push({ text: `Is your player most associated with ${team}?`, filter: p => str(p, "primaryTeam") === team });
  });

  // ── Role ──────────────────────────────────────────
  const roles = new Set<string>();
  candidates.forEach(p => { if (p.role) roles.add(p.role); });
  roles.forEach(role => {
    questions.push({ text: `Is your player primarily a ${role}?`, filter: p => p.role === role });
  });

  // ── Nationality ───────────────────────────────────
  const nats = new Set<string>();
  candidates.forEach(p => { if (p.nationality) nats.add(p.nationality); });
  if (nats.has("Indian")) questions.push({ text: "Is your player Indian?", filter: p => p.nationality === "Indian" });
  if (nats.has("Overseas")) questions.push({ text: "Is your player an Overseas player?", filter: p => p.nationality === "Overseas" });

  // ── Country (granular) ────────────────────────────
  collectUnique(candidates, "country", ["India"]).forEach(country => {
    questions.push({ text: `Is your player from ${country}?`, filter: p => str(p, "country") === country });
  });

  // ── Overseas region ───────────────────────────────
  const regionLabels: Record<string, string> = {
    SENA: "a SENA country (Aus/Eng/NZ/SA)",
    Caribbean: "the Caribbean (West Indies)",
    Subcontinent: "the Asian subcontinent (non-India)",
  };
  collectUnique(candidates, "overseasType", ["N/A"]).forEach(type => {
    questions.push({ text: `Is your player from ${regionLabels[type] || type}?`, filter: p => str(p, "overseasType") === type });
  });

  // ── Batting & bowling style ───────────────────────
  collectUnique(candidates, "battingStyle").forEach(s => {
    questions.push({ text: `Does your player bat ${s}?`, filter: p => str(p, "battingStyle") === s });
  });
  collectUnique(candidates, "bowlingStyle", ["None"]).forEach(s => {
    questions.push({ text: `Does your player bowl ${s}?`, filter: p => str(p, "bowlingStyle") === s });
  });

  // ── Batting position ──────────────────────────────
  collectUnique(candidates, "battingPosition").forEach(pos => {
    questions.push({ text: `Does your player typically bat in the ${pos}?`, filter: p => str(p, "battingPosition") === pos });
  });

  // ── Pace category ─────────────────────────────────
  collectUnique(candidates, "paceCategory", ["None"]).forEach(cat => {
    questions.push({ text: `Is your player classified as ${cat} pace?`, filter: p => str(p, "paceCategory") === cat });
  });

  // ── Career phase ──────────────────────────────────
  collectUnique(candidates, "careerPhase").forEach(phase => {
    questions.push({ text: `Does your player have a ${phase} IPL career?`, filter: p => str(p, "careerPhase") === phase });
  });

  // ── Personality ───────────────────────────────────
  collectUnique(candidates, "personality").forEach(p_type => {
    questions.push({ text: `Would you describe your player's personality as "${p_type}"?`, filter: p => str(p, "personality") === p_type });
  });

  // ── Era ───────────────────────────────────────────
  collectUnique(candidates, "era").forEach(era => {
    questions.push({ text: `Is your player considered a ${era}?`, filter: p => str(p, "era") === era });
  });

  // ── Fan base ──────────────────────────────────────
  collectUnique(candidates, "fanBase").forEach(fb => {
    questions.push({ text: `Does your player have a ${fb} fan following?`, filter: p => str(p, "fanBase") === fb });
  });

  // ── Physical build ────────────────────────────────
  collectUnique(candidates, "physicalBuild").forEach(build => {
    questions.push({ text: `Is your player ${build} in build?`, filter: p => str(p, "physicalBuild") === build });
  });

  // ── Speciality ────────────────────────────────────
  collectUnique(candidates, "speciality").forEach(spec => {
    questions.push({ text: `Is your player known as a ${spec}?`, filter: p => str(p, "speciality") === spec });
  });

  // ── Award questions ───────────────────────────────
  const awards = new Set<string>();
  candidates.forEach(p => p.awards?.forEach(a => awards.add(a)));
  awards.forEach(award => {
    questions.push({ text: `Has your player won the ${award}?`, filter: p => p.awards?.includes(award) || false });
  });

  // ── Boolean trait questions ───────────────────────
  questions.push({ text: "Has your player ever been a captain in the IPL?", filter: p => p.isCaptain === true });
  questions.push({ text: "Is your player currently active in the IPL?", filter: p => bool(p, "isActive") });
  questions.push({ text: "Has your player been involved in controversies?", filter: p => bool(p, "isControversial") });
  questions.push({ text: "Does your player have tattoos?", filter: p => bool(p, "hasTattoo") });
  questions.push({ text: "Does your player have a beard?", filter: p => bool(p, "hasBeard") });

  // ── IPL titles ────────────────────────────────────
  questions.push({ text: "Has your player won at least one IPL title?", filter: p => num(p, "iplTitles") >= 1 });
  questions.push({ text: "Has your player won 3 or more IPL titles?", filter: p => num(p, "iplTitles") >= 3 });

  // ── Team count ────────────────────────────────────
  questions.push({ text: "Has your player played for only one IPL team?", filter: p => (num(p, "totalTeams") || p.teams?.length || 1) === 1 });
  questions.push({ text: "Has your player played for 3 or more IPL teams?", filter: p => (num(p, "totalTeams") || p.teams?.length || 1) >= 3 });
  questions.push({ text: "Has your player played for 5 or more IPL teams?", filter: p => (num(p, "totalTeams") || p.teams?.length || 1) >= 5 });

  // ── Season count ──────────────────────────────────
  questions.push({ text: "Has your player played more than 10 IPL seasons?", filter: p => (num(p, "totalSeasons") || p.seasons?.length || 0) > 10 });
  questions.push({ text: "Has your player played fewer than 5 IPL seasons?", filter: p => (num(p, "totalSeasons") || p.seasons?.length || 0) < 5 });

  // ── Debut era ─────────────────────────────────────
  questions.push({ text: "Did your player debut in the IPL before 2012?", filter: p => num(p, "debutIPLYear") > 0 && num(p, "debutIPLYear") < 2012 });
  questions.push({ text: "Did your player debut in the IPL after 2018?", filter: p => num(p, "debutIPLYear") > 2018 });
  questions.push({ text: "Was your player part of the inaugural 2008 IPL?", filter: p => num(p, "debutIPLYear") === 2008 });

  // ── Season-based questions ────────────────────────
  questions.push({ text: "Did your player play in the inaugural 2008 IPL season?", filter: p => p.seasons?.includes(2008) || false });
  questions.push({ text: "Is your player playing in the 2025 IPL season?", filter: p => p.seasons?.includes(2025) || false });
  questions.push({ text: "Did your player play in IPL 2020 (UAE bubble)?", filter: p => p.seasons?.includes(2020) || false });

  // ── Celebration / personality bonus questions ─────
  questions.push({ text: "Does your player have a unique/famous celebration?", filter: p => str(p, "celebrationStyle") !== "Standard" && str(p, "celebrationStyle") !== "" });
  questions.push({ text: "Is your player known for being funny or entertaining off the field?", filter: p => str(p, "personality") === "Entertainer" || str(p, "personality") === "Flamboyant" });
  questions.push({ text: "Is your player known for calm temperament under pressure?", filter: p => ["Captain Cool", "Gentleman", "Calm Leader", "Silent Worker"].includes(str(p, "personality")) });
  questions.push({ text: "Is your player known for aggressive on-field behavior?", filter: p => ["Aggressive", "Fiery"].includes(str(p, "personality")) });

  // ── Specific franchise participation ──────────────
  const franchises = ["CSK", "MI", "RCB", "KKR", "SRH", "DC", "RR", "PBKS"];
  franchises.forEach(f => {
    questions.push({ text: `Has your player ever played for ${f}?`, filter: p => bool(p, `playedFor${f}`) });
  });

  // ── Record brackets ───────────────────────────────
  collectUnique(candidates, "highestScore").forEach(score => {
    questions.push({ text: `Is your player's highest IPL score ${score}?`, filter: p => str(p, "highestScore") === score });
  });
  
  collectUnique(candidates, "bestBowling", ["<3 wickets"]).forEach(bowl => {
    questions.push({ text: `Is your player's best IPL bowling performance ${bowl}?`, filter: p => str(p, "bestBowling") === bowl });
  });

  // ── Playing hand/style specifics ──────────────────
  questions.push({ text: "Does your player bat left-handed?", filter: p => str(p, "battingHand") === "Left-hand" });
  questions.push({ text: "Is your player a left-arm bowler?", filter: p => str(p, "bowlingHand") === "Left-arm" });
  questions.push({ text: "Does your player ever keep wickets?", filter: p => bool(p, "isWicketKeeper") });

  // ── Specific awards/milestones ────────────────────
  questions.push({ text: "Has your player ever scored a century in the IPL?", filter: p => bool(p, "hasIPLCentury") });
  questions.push({ text: "Has your player ever taken a 5-wicket haul in the IPL?", filter: p => bool(p, "hasIPL5WicketHaul") });
  questions.push({ text: "Has your player ever won the Orange Cap?", filter: p => bool(p, "hasOrangeCap") });
  questions.push({ text: "Has your player ever won the Purple Cap?", filter: p => bool(p, "hasPurpleCap") });

  return questions;
}
