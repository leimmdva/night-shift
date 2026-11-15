---
inclusion: always
---

# Development log rule

After finishing any task that changes code, specs, hooks, steering or assets, and before committing:

1. Append a Timeline entry at the end of the "Timeline" section of `docs/KIRO_LOG.md`, newest last, in this format:

```
### YYYY-MM-DD — <title>
- What: ...
- Kiro feature: spec / hook / steering / agent / MCP / vibe coding
- How Kiro helped: ... (what Kiro generated, what it caught, what was corrected by hand)
- Problems and fixes: ...
- Commit: <hash>
```

2. Keep the entry short (max ~8 lines). Use the real date and the real commit hash. If the hash is not known yet, write "pending" and fill it in with the next entry's commit.
3. Update "Metrics" if any number changed (bug packs, unit tests, specs, hooks, bundle sizes after `npm run build`).
4. If a new file appears in `.kiro/` (steering, spec, hook, agent, MCP server), add a row to "Kiro features in this repo".
5. Be factual. Do not invent features, numbers or events. Write "TBD" when something is unknown.
6. Write in English.
