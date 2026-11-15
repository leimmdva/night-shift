# Session 08: Session records, dev-log rule and Kiroween compliance check

- Date: 2026-11-16
- How Kiro was run: Kiro IDE, non-interactive session.
- Commit(s): the commit "docs: session records, owner feedback and Kiroween compliance check" (hash recorded in the next KIRO_LOG entry)

## Prompt given to Kiro

````markdown
Make our development record complete and keep the whole process compliant with the Kiroween hackathon rules. Commit at the end, do not push.

1. SESSION RECORDS
Create docs/kiro-sessions/. Each Kiro session gets one file named YYYY-MM-DD-NN-<slug>.md containing: date, how Kiro was run (Kiro CLI non-interactive / Kiro IDE / spec mode), the full prompt given to Kiro, Kiro's final summary (what was done, files, what it was not happy with), the resulting commit hash(es), and an "Owner feedback" section (what the owner accepted, rejected or asked to redo, and why).
Backfill today's (2026-11-15) sessions from these files (copy the prompt text verbatim; take the summary from the end of each log; ignore [INFO] and [tool] status lines). The scratch directory is:
<local reference folder>/
- 01 sprites v1: prompt-sprites.md, log sprites.log → commit a674312. Owner feedback: did not like it (too flat, too small, little character); gave three new style references (a glossy slime, a green creature with a strong outline and rim highlights, a detailed eyeball monster) and asked for static pixel art in that style.
- 02 dev log: prompt-devlog.md, log devlog.log → commit 9e9136d.
- 03 sprites v2 (detailed style): prompt-sprites-v2.md, log sprites-v2.log. First attempt failed with a Kiro server error (ModelRegistryUnavailableError); the retry was stopped part-way by the owner's request to switch to 2.5D. No commit.
- 04 sprites v3 (2.5D): prompt-sprites-v3.md, log sprites-v3.log → commit 53b32f3. Owner feedback: accepted.
- 05 office map v1: prompt-map.md, log map.log (stopped by a 10-minute time limit), continued in a fresh session with prompt-map-continue.md, log map3.log → commit a03044c. (An attempt to resume the stopped session failed with SessionHeldElsewhereError.) Owner feedback: replaced; the owner supplied a warm, cosy office illustration as a style reference.
- 06 office map v2: prompt-map-v2.md, log map4.log → commit 853d1f8. Owner feedback: approved as is.
- 07 production kickoff (steering decisions, game-flow spec, UI kit): prompt-kickoff.md, log kick.log → its commits.
Do NOT copy the reference images themselves into the repo (their licences are unknown); describe them in words, as above.
When copying prompts, replace every local scratch path (anything starting with /private/tmp/ or containing "scratch") with a short placeholder such as `<local reference folder>/ref-office.png`, so no machine-specific paths end up in the repo. Present the sessions as what they are: the owner directing Kiro. Do not add statements about who typed or drafted the prompts.
Also add one file for the earlier sessions (before 2026-11-15) that says their prompts were not recorded and points to the git history and the existing KIRO_LOG timeline.

2. DEV-LOG RULE
Update .kiro/steering/dev-log.md so that recording is continuous and in strict chronological order — no session, decision, failed attempt, server error, interruption, redo or owner feedback is ever skipped, and nothing is reconstructed later if it can be written now. From now on, for every session, Kiro also writes its docs/kiro-sessions/ file (prompt, summary, commits, owner feedback — leave "Owner feedback: pending" if not known yet) and adds an "Owner feedback" line to the KIRO_LOG Timeline entry. Add "Owner feedback" lines to today's Timeline entries in docs/KIRO_LOG.md, and link each entry to its session file. Also record in KIRO_LOG under Decisions the owner's final decisions from steering (8 monsters, one bug at a time, laptop rule, 15–20 min, server room final, player and Sudo look, CC0 + synthesised sound).

3. KIROWEEN COMPLIANCE
Create .kiro/steering/kiroween-rules.md (inclusion: always) with the submission rules every change must respect:
- Public GitHub repo with an OSI-approved licence (LICENSE file, MIT) visible in the About section.
- The /.kiro directory is committed and NOT in .gitignore (specs, hooks, steering, agents, settings).
- Everything in the repo and the submission is in English.
- A working live demo (GitHub Pages) that stays up until the end of judging (30 January).
- A public YouTube demo video under 3 minutes.
- A written explanation of how Kiro was used (vibe coding, specs, hooks, steering, MCP, agents) — sourced from docs/KIRO_LOG.md and docs/kiro-sessions/.
- No copyrighted or unlicensed third-party assets: every font, sound and image not made in this repo must have an OSI/CC0/OFL licence and be listed with its source in README ("Credits").
- Submission deadline: 5 December 2026 01:00 Türkiye time is the official cut-off; our own target is 3 December.
If any part of this list conflicts with what you know of the official Kiroween rules, say so in your summary instead of guessing.
Add a script scripts/check-submission.mjs and npm script "check-submission" that verifies what can be checked locally: LICENSE exists and is OSI (MIT); .kiro is not ignored by .gitignore and is tracked by git; README has "How Kiro was used" and "Credits" sections; docs/KIRO_LOG.md and docs/kiro-sessions/ exist and every Timeline commit hash exists in git; every file in public/fonts and public/audio (if present) is listed in Credits; no non-ASCII-heavy (non-English) text in src/ user-facing strings (warn only). Print a pass/fail checklist. Run it and fix anything that fails.

4. Run npx vitest run, npm run build and npm run check-submission. Commit as "docs: session records, owner feedback and Kiroween compliance check". Print the checklist output.
````

## Kiro's final summary

See the KIRO_LOG Timeline entry for 2026-11-16. Summary of the work: created `docs/kiro-sessions/` with one file per session, rewrote `.kiro/steering/dev-log.md` for continuous chronological recording, added `.kiro/steering/kiroween-rules.md`, added `scripts/check-submission.mjs` and the `check-submission` npm script, and updated `docs/KIRO_LOG.md` and the README. Differences from the Kiroween pages found online are listed in the KIRO_LOG entry.

## Owner feedback

Pending.
