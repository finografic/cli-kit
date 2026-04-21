---
name: scaffold-cli-help
description: Define or update root CLI help for @finografic CLI projects using HelpConfig in src/cli.help.ts and renderHelp from @finografic/cli-kit/render-help. Use when adding commands, changing help layout, or aligning help with the ecosystem pattern.
trigger: User asks to add or change CLI help, root help, cli.help.ts, HelpConfig, or renderHelp for a finografic CLI
tools: [file-read, file-edit, terminal]
---

# Scaffold / maintain CLI help (`cli.help.ts`)

This skill applies the **typed root help** pattern used across `@finografic` CLI tools (`genx`, `gli`, `deps-policy`, and scaffolds from genx). Rendering lives in **`@finografic/cli-kit`**, not in a local `src/core/render-help` copy.

## Read first

- **Consumer repo:** `.github/instructions/project/cli-help-patterns.instructions.md` when that file exists.
- **Canonical types and behavior:** `docs/spec/CLI_KIT.md` and `README.md` in the **`@finografic/cli-kit`** repository (module `render-help`).

Keep this skill **procedural**; defer type shapes and section ordering to those documents.

## Prerequisites

- `@finografic/cli-kit` is listed in `dependencies` (or `devDependencies` for dev-only CLIs like `deps-policy`).
- No `core/*` path alias is required — import the kit subpath directly.

## Procedure

1. **Open or create** `src/cli.help.ts` at the **repository root of `src/`** (never nested under `commands/` for root help).

2. **Import types** from the kit:

   ```ts
   import type { HelpConfig } from '@finografic/cli-kit/render-help';
   ```

   Do not import help types from ad-hoc `src/types/` copies of the renderer.

3. **Export a single named config** `cliHelp` (not default export):

   ```ts
   export const cliHelp: HelpConfig = {
     main: { bin: '…', args: '<command> [options]' },
     // commands, examples, footer — see instruction file or CLI_KIT.md
   };
   ```

4. **Follow section conventions** (details in project instructions or CLI_KIT.md):
   - **examples:** `label` = human description, `description` = exact command line.
   - **footer:** `label` may use `<placeholder>` tokens; `description` optional dim line.

5. **Wire `src/cli.ts`:** import `renderHelp` from `@finografic/cli-kit/render-help` and `cliHelp` from `./cli.help.js` (use `.js` extension if the project uses `verbatimModuleSyntax`). Call `renderHelp(cliHelp)` only from the CLI entry / help branch — **not** inside `cli.help.ts`.

6. **Optional shared defaults:** some repos use a small shared config for `minWidth` / alignment — follow the existing project pattern if present.

7. **Verify:** `pnpm typecheck` and run the binary with `--help` or no args to confirm layout.

## When adding a new command

- Add a row to `commands.list` (keep descriptions one line).
- Add **Examples** entries where users will copy-paste real invocations.
- Update per-command `CommandHelpConfig` modules if this repo splits `--help` per command.

## Design constraints

- Root help stays **declarative data** (`HelpConfig`); rendering is centralized in **`@finografic/cli-kit/render-help`**.
- Do not duplicate `renderHelp` logic in application code.
