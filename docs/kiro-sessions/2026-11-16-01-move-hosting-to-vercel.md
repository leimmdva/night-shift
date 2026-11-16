# Session 01 of 2026-11-16: Move hosting from GitHub Pages to Vercel

- Date: 2026-11-16
- How Kiro was run: Kiro IDE, non-interactive session.
- Commit(s): "chore: move hosting from GitHub Pages to Vercel" (hash in the next KIRO_LOG entry)

## Prompt given to Kiro

````markdown
The owner has decided to stop using GitHub Pages and host the live demo on Vercel instead. (Reason: GitHub Actions runs for this account stopped starting — "The job was not started because your account is locked due to a billing issue" — so the Pages deploy has failed since commit 5c3fa5e and the live site was stuck on the 31 October build.) The Vercel project will be linked to this GitHub repo and deploy every push to main automatically. Prepare the repo for that:

1. vite.config.ts: set `base: '/'` (Vercel serves the site from the domain root). Make sure every asset/sprite/font/map path in src/ and index.html still works with base '/' (use import.meta.env.BASE_URL or root-relative paths, not hard-coded '/night-shift/').
2. Add vercel.json with: framework "vite", buildCommand "npm run build", outputDirectory "dist", installCommand "npm ci", and long-lived immutable caching headers for /assets/* (hashed files), plus sensible caching for /sprites/* and /fonts/*. No rewrites needed unless the app uses client-side routes.
3. Remove .github/workflows/deploy.yml (GitHub Pages deploy). Do not add another GitHub Actions workflow.
4. Update every mention of GitHub Pages: .kiro/steering/tech.md (deployment row: Vercel, Hobby plan, auto-deploy from main; base URL '/'), structure.md, project.md, kiroween-rules.md (live demo hosted on Vercel, must stay up until 30 January), README.md (the demo link currently points to a wrong github.io URL — replace it with the placeholder https://night-shift.vercel.app for now; the real URL will be confirmed after the first deploy), and scripts/check-submission.mjs if it checks anything Pages-specific. Leave historical KIRO_LOG timeline entries as they are (they describe what happened then).
5. Add a Decisions line to docs/KIRO_LOG.md: "Hosting moved from GitHub Pages to Vercel on 2026-11-16" with the reason above.
6. Run npx vitest run, npm run build, npm run check-submission, and `npx vite preview --port 4173` briefly with a curl of http://localhost:4173/ and one sprite and one font path to confirm they return 200 with base '/'; stop the preview server afterwards.
7. Follow the dev-log steering rule (session file + Timeline entry). Commit as "chore: move hosting from GitHub Pages to Vercel". Do not push.
````

## Kiro's summary

- `vite.config.ts`: `base: '/'`. No source file or `index.html` references assets by path (no `/night-shift/` anywhere in `src/`), so nothing else needed changing. The sprites and font in `public/` are not loaded by game code yet.
- Added `vercel.json` (framework vite, build, output, `npm ci`; `/assets/*` immutable for one year, `/sprites/*` one day plus stale-while-revalidate, `/fonts/*` 30 days). No rewrites: no client-side routes.
- Removed `.github/workflows/deploy.yml`; no new workflow.
- Updated `tech.md`, `structure.md`, `project.md`, `kiroween-rules.md`, the `game-flow` tasks line that mentioned Pages, and the README demo link (placeholder `https://night-shift.vercel.app`). `scripts/check-submission.mjs` has nothing Pages-specific.
- Added a Decisions line and a Timeline entry in `docs/KIRO_LOG.md`; filled the pending commit hash of the previous entry (8a76e4a).
- Checks: Vitest 28/28 passed, build succeeded, `check-submission` 12 passed. Preview on port 4173 returned 200 for `/`, `/sprites/monsters/async-phantom.png` and `/fonts/PressStart2P-Regular.ttf`; `index.html` references `/assets/...`. The preview server was stopped.
- Not verified: the real Vercel deploy and the final URL. The README link is a placeholder. Historical KIRO_LOG entries still mention GitHub Pages, as instructed. `src/bugs/02-off-by-one/index.ts` contains "pages" only as pagination text.

## Owner feedback

Pending.
