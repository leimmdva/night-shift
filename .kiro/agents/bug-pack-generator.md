# Agent: Bug Pack Generator

## Purpose
Generate a complete, validated Night Shift bug pack from a natural-language description.
Output is a ready-to-use `src/bugs/NN-monster-name/index.ts` file that passes `npm run validate-packs`.

## When to use
- You want to add a new bug type to the game
- You want to generate custom packs for a specific audience (school, company)
- You are testing the Power feature (spec-to-pack generation)

## Inputs
Provide in your prompt:
- **Bug type:** e.g. "missing await on an async function"
- **File name:** e.g. `payment.js`
- **Monster name:** e.g. "Async Phantom"
- **Order number:** the spawn order (1–8)
- **Real-world impact:** what this bug causes in production

## What the agent does
1. Writes a realistic broken JavaScript function that contains exactly the described bug
2. Writes a test suite (inline runner format) with at least 3 tests that fail on broken code
3. Writes the correct solution
4. Writes 3-level Sudo hints (location → type → solution)
5. Writes the autopsy card (what / impact / fix)
6. Writes the morning meeting question and 3 answers
7. Runs `node scripts/validate-pack.js NN-monster-name` and iterates until it passes
8. Outputs the completed `index.ts`

## Constraints
- Broken code must be realistic — something a developer might actually write
- Tests must be behaviour-based, not implementation-based
- Hints must not give away the solution at level 1 or 2
- All strings in English
- `id` must match the folder name (strip `NN-` prefix)

## Output format
A single `index.ts` file following the `BugPack` type in `src/types/BugPack.ts`.
Validated by `npm run validate-packs` before delivery.
