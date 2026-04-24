# @finografic/cli-kit — Handoff

> **How to maintain this file**
> Update after sessions that change architecture, add/remove features, resolve open questions, or shift priorities — not every session.
> Update only the sections that changed. Keep the total under 150 lines.
> Write in present tense. No code snippets — describe what exists, not how it works.
> `.claude/memory.md` = session work log. `.ai/handoff.md` = project state snapshot. Never duplicate between the two.

📅 Apr 24, 2026

## Project

`@finografic/cli-kit` — shared CLI primitives library for the `@finografic` ecosystem. Hard dependency for all `@finografic` CLI packages. Current version **v0.3.5**. Consumed via `pnpm` `file:` dependency by `deps-policy`; not yet published to GitHub registry.

## Architecture

Multi-entrypoint ESM library (tsdown, 9+ subpaths). Each subpath is an independent module with its own `.mjs` + `.d.mts` output.

- `/flow` — `createFlowContext`, flag-aware prompt wrappers, `requireArg`, `optionalArg`
- `/render-help` — `renderHelp`, `renderCommandHelp`, `withHelp`
- `/file-diff` — `confirmFileWrite`, `renderFileDiff`, `createDiffConfirmState`
- `/tui` — full table system (`column`, `createTable`, `renderRow`, `formatCell`), `renderSectionTitle`, ANSI-aware padding, `multiselectLineBreak`
- `/prompts` — thin clack wrapper (no FlowContext), `createSelectOptions`, cancel-safe
- `/commands` — `RunCommandParams`, `CommandHandler`, `SubcommandHandler` types
- `/paths` — `tildeify`, `resolveTargetDir`
- `/xdg` — `getConfigPath`, `getCachePath`, `readJsonc`, `writeJsonc`
- `/` root — re-exports `commands` types only

## Stack

TypeScript (strict, ESM, `verbatimModuleSyntax`), pnpm, tsdown. Runtime deps: `@clack/prompts`, `@clack/core`, `diff`, `picocolors`, `strip-ansi`, `jsonc-parser`.

## tui Table System

The tui module is the most-evolved subsystem. Key design points:

- `ColumnDef<T>` owns `get` (raw value) and optional `format` (colorized display). Width computed from raw values; format applied only at render time.
- `createTable` closure computes widths ANSI-aware from the full dataset, returns `TableInstance<T>` with `renderRow`, `renderHeaders`, `columns`, `gap`, `totalWidth`.
- `renderRow(values[], columns[], gap?)` and `formatCell(value, col)` are pure layout primitives, exported standalone.
- `renderSectionTitle(name, width, options?)` — dim title + dim divider; `PicoColor` type narrows color options.
- All padding uses `stringWidth` (ANSI-aware via `strip-ansi`) — essential for colored strings.
- `CLACK_MULTISELECT_PREFIX_WIDTH` compensation (2 chars) must be applied in consumer code when aligning a static table with a clack multiselect. See `deps-policy` for the pattern.

## Key Decisions

1. Multi-entrypoint (not monolithic barrel) — tree-shaking, avoids name conflicts (2026-04)
2. `createTable` closes over data; pure `renderRow`/`formatCell` remain composable (2026-04)
3. All ANSI-aware padding consolidated into `tui/padding.ts` (2026-04)
4. `PicoColor` type derived from picocolors — prevents `pc[color]` with arbitrary strings (2026-04)
5. `withHelp` wrapper pattern — commands own help content, no guard boilerplate (2026-04)
6. Root barrel exports only `commands` types — avoids name conflicts between flow/prompts (2026-04)

## Open Questions / Next Steps

1. Publish to GitHub registry — not done yet; `deps-policy` consumes via `file:` link.
2. `genx` still uses local `src/core/` copies — migration not started.
3. `feature/` folder in repo root appears to be a genx scaffold template that landed here by mistake — verify with genx maintainer and remove if confirmed.
4. See ROADMAP.md for mid-term additions: `withSpinner`, `renderStatusBadge`, testing utilities.

## Docs

- `README.md` — user-facing module reference with examples
- `docs/spec/CLI_KIT.md` — authoritative technical spec (types, contracts, decisions)
- `docs/todo/ROADMAP.md` — prioritised additions
- `.claude/memory.md` — session work log (gitignored)
