---
inclusion: always
---

# Development log rule

The development record is written continuously, in strict chronological order. No session, decision, failed attempt, server error, interruption, redo or owner feedback is skipped, and nothing is reconstructed later if it can be written now. The jury reads this record to judge how Kiro was used, so gaps and failures belong in it as much as successes.

## Every session

For every Kiro session, including ones that fail, are interrupted, produce no commit or change no code:

1. Create `docs/kiro-sessions/YYYY-MM-DD-NN-<slug>.md` (NN = running number within that date, two digits). It contains:
   - date
   - how Kiro was run (Kiro CLI non-interactive / Kiro IDE / spec mode)
   - the full prompt given to Kiro, verbatim. Replace local machine paths with a placeholder such as `<local reference folder>/ref-office.png`. Never copy reference images that have unknown licences into the repo; describe them in words.
   - Kiro's final summary: what was done, files, what it was not happy with. If the session ended without a summary, say how it ended (server error, time limit, interruption).
   - the resulting commit hash(es), or "none"
   - an "Owner feedback" section: what the owner accepted, rejected or asked to redo, and why. Write "Owner feedback: pending" if it is not known yet, and fill it in as soon as it is known.
2. Present sessions as what they are: the owner directing Kiro. Do not add statements about who typed or drafted a prompt.
3. Sessions before 2026-11-15 are covered by `docs/kiro-sessions/before-2026-11-15-not-recorded.md`. Do not reconstruct them.

## Timeline entry

After finishing any task that changes code, specs, hooks, steering or assets, and before committing, append an entry at the end of the "Timeline" section of `docs/KIRO_LOG.md`, newest last, in this format:

```
### YYYY-MM-DD — <title>
- What: ...
- Kiro feature: spec / hook / steering / agent / MCP / vibe coding
- How Kiro helped: ... (what Kiro generated, what it caught, what was corrected by hand)
- Problems and fixes: ...
- Owner feedback: ... (accepted / rejected / redo, and why; "pending" if not known yet)
- Session: [docs/kiro-sessions/<file>.md](kiro-sessions/<file>.md)
- Commit: <hash>
```

Also add an entry for a session that changed nothing (failed attempt, server error, interruption), with "Commit: none".

## Rules

1. Strict chronological order: entries and session files are written in the order things happened. Do not insert later events earlier, except to fill in a "pending" field.
2. Keep an entry short (max ~9 lines). Use the real date and the real commit hash. If the hash is not known yet, write "pending" and fill it in with the next entry's commit.
3. Update "Metrics" if any number changed (bug packs, unit tests, specs, hooks, bundle sizes after `npm run build`).
4. If a new file appears in `.kiro/` (steering, spec, hook, agent, MCP server), add a row to "Kiro features in this repo".
5. When the owner gives a final decision (scope, flow, look, rules), also add it to "Decisions" in `docs/KIRO_LOG.md`.
6. Be factual. Do not invent features, numbers or events. Write "TBD" when something is unknown.
7. Write in English.
8. Run `npm run check-submission` before committing. It checks that every Timeline commit hash exists in git.
