---
inclusion: always
---

# Kiroween submission rules

Every change must respect these rules. If a change would break one, stop and say so.

1. **Public repo, OSI licence.** The GitHub repo is public. `LICENSE` is MIT and shows in the repo's About section.
2. **`/.kiro` is committed.** The `.kiro` directory (specs, hooks, steering, agents, settings) is tracked by git and never listed in `.gitignore`.
3. **English only.** Everything in the repo and in the submission is in English: code, comments, docs, in-game text, video, write-up.
4. **Live demo.** A working GitHub Pages demo stays up until the end of judging (30 January).
5. **Demo video.** A public YouTube video under 3 minutes. No copyrighted music.
6. **Kiro write-up.** A written explanation of how Kiro was used (vibe coding, specs, hooks, steering, MCP, agents). It is sourced from `docs/KIRO_LOG.md` and `docs/kiro-sessions/`, so those must stay complete (see `dev-log.md`).
7. **No unlicensed assets.** Every font, sound and image not made in this repo needs an OSI, CC0 or OFL licence and is listed with its source in the README section "Credits". Reference images with unknown licences stay out of the repo.
8. **Deadline.** The official cut-off is 5 December 2026, 01:00 Türkiye time (4 December, 2:00 PM Pacific). Our own target is 3 December.

Official-rule notes (checked 2026-11-16 against public pages; the official rules page itself could not be fetched):
- Submission Period is 30 October to 4 December 2026. The project must be built inside that period. All commits so far are dated 2026-10-31 or later.
- The live-demo end date (30 January) and the demo-video length come from this project's own checklist and from the 2025 rules. They are not confirmed for 2026.
- The 2025 rules also required choosing a category (Resurrection, Frankenstein, Skeleton Crew, Costume Contest). Check the 2026 submission form for categories.

Local check: `npm run check-submission` verifies what can be checked offline.
