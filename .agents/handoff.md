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
- `/` root — re-exports `commands` types only

## Stack

TypeScript (strict, ESM, `verbatimModuleSyntax`), pnpm, tsdown. Runtime deps: `@clack/prompts`, `@clack/core`, `diff`, `picocolors`, `strip-ansi`.

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

# @finografic/cli-kit — Handoff

## Project

`@finografic/cli-kit` — shared CLI primitives library for the `@finografic` ecosystem. Hard dependency for all `@finografic` CLI packages. Replaces the `src/core/` copy-paste convention. Phase: initial implementation complete, not yet published.

## Architecture

Multi-entrypoint ESM library (tsdown, 9 subpaths). Each subpath is an independent module with its own `.mjs` + `.d.mts` output. Consumers import only what they need:

- `/flow` — `createFlowContext`, flag-aware prompt wrappers, `requireArg`, `optionalArg`
- `/render-help` — `renderHelp`, `renderCommandHelp`, `renderSection`
- `/file-diff` — `confirmFileWrite`, `renderFileDiff`, `createDiffConfirmState`
- `/tui` — `padRight/Left`, `createDivider`, `computeNameWidth/VersionWidth` (generic), `multiselectLineBreak`
- `/prompts` — thin clack wrapper (no FlowContext), `createSelectOptions`, cancel-safe
- `/commands` — `RunCommandParams`, `CommandHandler`, `SubcommandHandler` types
- `/paths` — `tildeify`, `resolveTargetDir`
- `/` root — re-exports `commands` types only (avoids name conflicts between flow/prompts)

## Stack

- TypeScript (strict, ESM, `verbatimModuleSyntax`)
- pnpm
- tsdown (build → `dist/`)
- `@clack/prompts` + `@clack/core` 1.2.0, `diff` 8.0.4, `picocolors` 1.1.1

## Source origins

| Module            | Source                                                                                |
| ----------------- | ------------------------------------------------------------------------------------- |
| `flow`            | `@finografic-genx/src/core/flow/` — verbatim + `requireArg`/`optionalArg` added       |
| `render-help`     | `@finografic-genx/src/core/render-help/` — verbatim + `renderSection` added           |
| `file-diff`       | `@finografic-genx/src/core/file-diff/` — verbatim                                     |
| `tui/constants`   | `deps-cli/tui/tui.config.ts` — renamed, content unchanged                             |
| `tui/utils`       | `deps-cli/tui/format.tui.ts` — generalized (removed `DepEntryWithLatest` domain type) |
| `tui/multiselect` | `deps-cli/tui/multiselect.tui.ts` — verbatim                                          |
| `prompts`         | New — thin clack wrapper, opts are a subset of flow opts                              |
| `commands`        | New — `RunCommandParams`, `CommandHandler`, `SubcommandHandler` types                 |
| `paths`           | New — `tildeify`, `resolveTargetDir` (promoted from per-repo inline copies)           |
| `xdg`             | Removed 2026-08-24 — moved to `@finografic/core/xdg`                                  |

## Key Decisions

1. Multi-entrypoint (not monolithic barrel) — tree-shaking, avoids name conflicts (2026-04-11)
2. `prompts` opts are strict subset of `flow` opts — frictionless upgrade path (2026-04-11)
3. `tui` compute functions use generic constraints not domain types — works for any tabular CLI data (2026-04-11)
4. `cwd` required in `RunCommandParams`, never optional — testability, no hidden `process.cwd()` (2026-04-11)
5. Root barrel exports only `commands` types — flow/prompts share type names that would conflict (2026-04-11)

## Status

Build: clean. `pnpm build` outputs 9 `.mjs` + `.d.mts` pairs with zero TypeScript errors.
Not yet published to GitHub registry. Version `0.1.0`.

Consumer repos (`genx`, `gli`, `deps-policy`) still use local `src/core/` copies — migration not started.

## Open Questions

1. When to wire `genx` to consume the kit? Genx is the logical first consumer.
2. Should `@types/diff` be added as a devDep? (`diff` v8 ships its own types — currently not needed.)

## Next Steps

See [ROADMAP.md](/ROADMAP.md) for the full prioritised list. Immediate priorities:

1. Publish to GitHub registry.
2. Migrate `@finografic-genx` to import from kit (remove `src/core/`).
3. Mid-term: `withSpinner`, `renderTable`, `renderStatusBadge`, testing utilities.
