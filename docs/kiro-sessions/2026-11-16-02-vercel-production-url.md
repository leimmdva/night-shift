# Session 02 of 2026-11-16: First Vercel deploy and production URL

- Date: 2026-11-16
- How Kiro was run: Kiro IDE, non-interactive session.
- Commit(s): "docs: point demo links to the Vercel production URL" (hash in the next KIRO_LOG entry)

## Prompt given to Kiro

````markdown
The Vercel project is live. Production URL: https://night-shift-kiroween.vercel.app (Vercel project "night-shift", auto-deploys every push to main; Vercel Authentication is limited to preview deployments so production is public; the GitHub repo About link now points to this URL).
Important: the placeholder https://night-shift.vercel.app that was put in README belongs to a DIFFERENT, unrelated site. Replace it everywhere in the repo with https://night-shift-kiroween.vercel.app (README, steering, specs, docs). Leave verbatim prompts in docs/kiro-sessions/ unchanged.
Record the first Vercel deploy in docs/KIRO_LOG.md and a session file (deployment for commit a22a31e built and went READY in about 13 seconds; checked live: index, JS/CSS chunks, a sprite and the font return 200; the Monaco chunks load in the background; the laptop opens and shows profile.js). Note the two issues seen on the live site in Open issues: Monaco logs "Could not create web worker(s)" and requests /undefined (404), and the broken code of pack 01 still contains the spoiler comment "// Bug: ...".
Run npx vitest run, npm run build, npm run check-submission. Commit as "docs: point demo links to the Vercel production URL". Do not push.
````

## Kiro's summary

- The only live reference to the placeholder was the README demo link; it now points to `https://night-shift-kiroween.vercel.app`. Steering and specs had none. The remaining mentions are in `docs/kiro-sessions/2026-11-16-01-move-hosting-to-vercel.md` (verbatim prompt, unchanged) and in the historical KIRO_LOG entry that describes the placeholder.
- `docs/KIRO_LOG.md`: new Timeline entry, a Decisions line for the production URL, commit hash a22a31e filled into the previous entry, commit count in Metrics, and two Open issues (Monaco worker warning with `/undefined` 404; spoiler comment in pack 01 `broken.js`).
- Deploy facts come from the owner's report; Kiro did not check the live site.

## Owner feedback

Pending.
