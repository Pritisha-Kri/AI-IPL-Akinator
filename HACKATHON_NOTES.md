# IPL Akinator — Hackathon Ready Notes

## What was fixed

1. **First-question bug fixed**
   - Earlier first question was `Is your player an Indian cricketer?`
   - Dataset question engine had `Is your player Indian?`
   - Because text matching was exact, the first answer was ignored.

2. **Early wrong guessing reduced**
   - Guessing now waits for stronger confidence.
   - The engine will usually ask more useful questions before revealing the final player.

3. **Candidate pool tightened**
   - Similar players are separated more aggressively using score gap threshold `1.5` instead of `3`.

4. **Dependency conflict reduced**
   - Next.js is set to `14.2.16` with React 18 for smoother install/run.

## How to run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Main files

- `app/api/turn/route.ts` — main guessing engine
- `lib/dynamicQuestions.ts` — question bank generator
- `lib/players.json` — IPL players database
- `app/page.tsx` — landing page
- `app/game/page.tsx` — game UI

## Judge explanation

This project uses a weighted Akinator-style guessing engine. Each user answer increases or decreases every player's score. The next question is selected using an information-gain style split, so the game asks questions that best separate the remaining possible players.
