# @finografic/cli-kit — Technical Specification

📅 Apr 11, 2026

This document is the authoritative technical reference for `@finografic/cli-kit`. It covers the full API surface, architectural decisions, module contracts, and integration patterns. For a user-facing overview and usage examples, see [README.md](/README.md).

---

## Architecture Overview

`cli-kit` is a **multi-entrypoint ESM library** built with `tsdown`. Each subpath maps to a distinct responsibility:

```
@finografic/cli-kit
├── /flow          — Flag parsing + prompt resolution chain (FlowContext)
├── /render-help   — Typed help page renderers (HelpConfig, CommandHelpConfig)
├── /file-diff     — Unified diff display + per-file write confirmation
├── /tui           — Layout primitives, dynamic column widths, custom multiselect
├── /prompts       — Thin clack wrapper (no FlowContext, cancel-safe)
├── /commands      — RunCommandParams, CommandHandler, SubcommandHandler types
└── /             — Root barrel: re-exports commands types only
```

**Build output** (tsdown → `dist/`):

| File                                              | Description        |
| ------------------------------------------------- | ------------------ |
| `dist/flow.mjs` + `dist/flow.d.mts`               | flow module        |
| `dist/render-help.mjs` + `dist/render-help.d.mts` | render-help module |
| `dist/file-diff.mjs` + `dist/file-diff.d.mts`     | file-diff module   |
| `dist/tui.mjs` + `dist/tui.d.mts`                 | tui module         |
| `dist/prompts.mjs` + `dist/prompts.d.mts`         | prompts module     |
| `dist/commands.mjs` + `dist/commands.d.mts`       | commands module    |
| `dist/index.mjs` + `dist/index.d.mts`             | root barrel        |

Runtime dependencies: `@clack/prompts`, `@clack/core`, `diff`, `picocolors`.

---

## Module: `flow`

**Source:** `src/flow/flow.utils.ts`

The flow module is the primary interactive layer. It solves the problem of supporting both scripted (CI, `-y`) and interactive (human) invocations with identical code paths.

### Types

```ts
interface FlagDef {
  alias?: string;
  type: 'boolean' | 'string' | 'number';
  multi?: boolean;          // accumulates repeated flags into string[]
  description?: string;
}

type FlagDefs = Record<string, FlagDef>;

interface FlowContext<F extends FlagDefs = FlagDefs> {
  flags: {
    [K in keyof F]: F[K]['type'] extends 'boolean' ? boolean
                  : F[K]['type'] extends 'number'  ? number
                  : string;
  } & { y?: boolean; yes?: boolean };
  yesMode: boolean;   // true when -y or --yes present
  args: string[];     // positional (non-flag) tokens
}
```

### `createFlowContext`

```ts
function createFlowContext<F extends FlagDefs>(argv: string[], flagDefs: F): FlowContext<F>
```

Parses `argv` according to `flagDefs`. Rules:

- `--key` for boolean flags sets the flag to `true`.
- `--key value` for string/number flags consumes the next token.
- `-x` short aliases resolve via `flagDef.alias`.
- `-y` always sets `yesMode = true` (special-cased, no definition required).
- `--` terminates flag parsing; remaining tokens are positional.
- `multi: true` flags push values into an array instead of overwriting.

### Prompt functions

All prompt functions share the same **resolution chain**:

1. If `flagKey` is set and the flag value is present in `flow.flags` → resolve immediately (no prompt shown).
2. If `yesMode` is true and `required` is not set → return `default` (no prompt shown).
3. Otherwise → show the interactive clack prompt.

| Function                        | Signature                          | Notes                                                |
| ------------------------------- | ---------------------------------- | ---------------------------------------------------- |
| `promptSelect`                  | `(flow, opts) => Promise<T>`       | `fromFlag` converts string flag value to `T`         |
| `promptText`                    | `(flow, opts) => Promise<string>`  | `validate` runs against flag value too               |
| `promptConfirm`                 | `(flow, opts) => Promise<boolean>` | `skipMessage` logged when skipped via yes-mode       |
| `promptMultiSelect`             | `(flow, opts) => Promise<T[]>`     | Flag value is comma-separated                        |
| `promptAutocompleteMultiSelect` | `(flow, opts) => Promise<T[]>`     | No flagKey support; yes-mode returns `initialValues` |

Cancel behaviour (`Ctrl+C`): default is `process.exit(0)`. Pass `cancelBehavior: 'skip'` to return the default value instead.

### Prompt opts interfaces

```ts
interface PromptSelectOpts<T> {
  flagKey?: string;
  fromFlag?: (flagValue: string) => T | undefined;
  message: string;
  options: { value: T; label: string; hint?: string }[];
  default?: T;
  required?: boolean;
}

interface PromptTextOpts {
  flagKey?: string;
  message: string;
  default?: string | (() => string);
  placeholder?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
  required?: boolean;
  cancelBehavior?: 'exit' | 'skip';
}

interface PromptConfirmOpts {
  message: string;
  default?: boolean;
  skipMessage?: string;
  required?: boolean;
  cancelBehavior?: 'exit' | 'skip';
}

interface PromptMultiSelectOpts<T> {
  flagKey?: string;
  message: string;
  options: { value: T; label: string; hint?: string }[];
  initialValues?: T[];
  minOne?: boolean;
  required?: boolean;
}

interface PromptAutocompleteMultiSelectOpts<T> {
  message: string;
  options: { value: T; label: string; hint?: string }[];
  placeholder?: string;
  initialValues?: T[];
  required?: boolean;
}
```

---

## Module: `render-help`

**Source:** `src/render-help/render-help.utils.ts`

### Types

```ts
interface HelpConfig {
  main: { bin: string; args?: string };
  commands?: HelpNote;
  examples?: HelpNote;
  footer?: HelpNote;
  minWidth?: number;
}

interface HelpNote {
  title: string;
  list: Array<{ label: string; description: string }>;
  options?: HelpNoteOptions;
}

interface CommandHelpConfig {
  command: string;          // 'genx create'
  description: string;
  usage: string;            // 'genx create [options]'
  subcommands?: Array<{ name: string; description: string }>;
  options?: Array<{ flag: string; description: string }>;
  examples?: Array<{ command: string; description: string }>;
  requirements?: string[];  // bulleted list
  howItWorks?: string[];    // numbered list
  sections?: CommandHelpSection[];  // arbitrary pre-formatted sections
}

interface CommandHelpSection {
  title: string;
  content: string;          // pre-formatted, printed verbatim
}
```

### `renderHelp`

Renders the root help page. Colours: binary name in bold cyanBright, command labels in cyan, `<args>` in dim cyan, section titles in bold uppercase.

Column alignment is computed from the longest label — no manual padding needed.

### `renderCommandHelp`

Renders a per-command detail page. Section rendering order: USAGE → SUBCOMMANDS → OPTIONS → EXAMPLES → REQUIREMENTS → HOW IT WORKS → custom sections.

---

## Module: `file-diff`

**Source:** `src/file-diff/file-diff.utils.ts`

### Types

```ts
type DiffAction = 'write' | 'skip' | 'write-all';

interface DiffConfirmState {
  yesAll: boolean;
}
```

### `createDiffConfirmState`

Returns `{ yesAll: false }`. Pass the same instance to every `confirmFileWrite` call in a session so yes-to-all persists across files.

### `renderFileDiff`

```ts
function renderFileDiff(filePath: string, currentContent: string, proposedContent: string): void
```

Generates a unified diff via `diff.createPatch`, suppresses the `Index:` / `====` header lines, and renders through `clack.log.message`. Colour mapping: `+` lines → green, `-` lines → red, `@@` → cyan, `---`/`+++` → bold.

### `confirmFileWrite`

```ts
async function confirmFileWrite(
  filePath: string,
  currentContent: string,
  proposedContent: string,
  state?: DiffConfirmState,
): Promise<DiffAction>
```

Short-circuits immediately with `'skip'` if content is identical. If `state.yesAll` is true, renders the diff and returns `'write'` without prompting. Otherwise shows a three-option select (yes / skip / yes-to-all) and mutates `state.yesAll` when the user picks "yes-to-all".

---

## Module: `tui`

**Source:** `src/tui/tui.utils.ts`, `src/tui/tui.constants.ts`, `src/tui/tui.multiselect.ts`

### Constants

```ts
const TUI_DEFAULTS = {
  name:        { min: 28, extraPad: 6 },
  version:     { min: 8,  extraPad: 1 },
  multiselect: { nameExtraPad: 2 },
} as const;
```

Adjust `TUI_DEFAULTS` centrally to tune column widths across all table and prompt renderers.

### Layout utilities

```ts
function padLeft(value: string, width: number): string
function padRight(value: string, width: number): string
function createDivider(width: number): string   // dim ──── with 2-space indent
```

### Column width computation

```ts
function computeNameWidth<T extends { name: string }>(
  entries: T[],
  extraPad?: number,   // default: TUI_DEFAULTS.name.extraPad
): number

function computeVersionWidth<T extends { current: string; latest?: string | null; prefix: string }>(
  entries: T[],
  extraPad?: number,   // default: TUI_DEFAULTS.version.extraPad
): number
```

Both functions floor the result at the respective `min` value, then add `extraPad`. They are generic — no domain-specific imports. The `prefix` field on the version constraint exists to support semver range prefixes (`^`, `~`, `>=`) in the "latest" column display.

### `multiselectLineBreak`

A custom clack multiselect built on `@clack/core`'s `MultiSelectPrompt`. Identical behaviour to `@clack/prompts`'s `multiselect` except the submit state renders selected items one per line (not comma-separated). Supports `maxItems` to limit the visible scroll window.

```ts
async function multiselectLineBreak<T>(opts: MultiselectOpts<T>): Promise<T[] | symbol>

interface MultiselectOption<T> {
  value: T;
  label?: string;
  hint?: string;
  disabled?: boolean;
  initialValue?: boolean;
}

interface MultiselectOpts<T> {
  message: string;
  options: MultiselectOption<T>[];
  initialValues?: T[];
  required?: boolean;
  maxItems?: number;
}
```

Returns the selected values or a cancel symbol. Check with `isCancel()` (re-exported from this module).

---

## Module: `prompts`

**Source:** `src/prompts/prompts.utils.ts`

A cancel-safe clack wrapper for commands with no flag-driven behaviour. Designed so that adding a `-y` fast-path later is a two-line change (import swap + add `flow` arg).

### Types

```ts
interface SelectOption<T> {
  value: T;
  label: string;
  hint?: string;
}

interface PromptSelectOpts<T> {
  message: string;
  options: SelectOption<T>[];
  default?: T;
}

interface PromptMultiSelectOpts<T> {
  message: string;
  options: SelectOption<T>[];
  initialValues?: T[];
  minOne?: boolean;
}

interface PromptTextOpts {
  message: string;
  default?: string | (() => string);
  placeholder?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
  cancelBehavior?: 'exit' | 'skip';
}

interface PromptConfirmOpts {
  message: string;
  default?: boolean;
  cancelBehavior?: 'exit' | 'skip';
}
```

These are a strict subset of the equivalent `flow` opts (minus `flagKey`, `fromFlag`, `required`, `skipMessage`). Upgrading is additive.

### `createSelectOptions`

```ts
function createSelectOptions<T>(
  items: T[],
  toOption: (item: T) => SelectOption<T>,
): SelectOption<T>[]
```

Thin factory — avoids repeated `.map()` boilerplate when building option arrays from domain data.

---

## Module: `commands`

**Source:** `src/commands/commands.types.ts`

### Types

```ts
interface RunCommandParams {
  argv: string[];
  cwd: string;
}

type CommandHandler = (params: RunCommandParams) => Promise<void> | void;

type SubcommandHandler = (argv: string[], cwd: string) => Promise<void> | void;
```

`cwd` is always provided by the `cli.ts` entry point. Commands must not call `process.cwd()` internally — this makes commands testable without side effects.

---

## Subcommand Pattern

For commands with sub-routing (e.g. `config add`, `config list`), use a local registry inside the orchestrator. Sub-handler functions are private — only `run{Name}Command` is exported from the barrel.

```ts
// config.command.ts
import { renderCommandHelp } from '@finografic/cli-kit/render-help';
import type { RunCommandParams, SubcommandHandler } from '@finografic/cli-kit/commands';
import { configHelp } from './config.help.js';

export async function runConfigCommand({ argv, cwd }: RunCommandParams): Promise<void> {
  const [subcommand = '', ...subArgs] = argv;

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    renderCommandHelp(configHelp);
    return;
  }

  const subcommands: Record<string, SubcommandHandler> = {
    add:    (a, c) => runAdd(a, c),
    list:   ()     => runList(),
    remove: (a)    => runRemove(a),
  };

  if (!subcommands[subcommand]) {
    console.error(`Unknown subcommand: ${subcommand}`);
    renderCommandHelp(configHelp);
    process.exit(1);
    return;
  }

  await subcommands[subcommand](subArgs, cwd);
}
```

---

## Canonical `cli.ts` Shape

The root entry point owns routing and lifecycle only. No business logic, no clack calls, no direct `process.exit` except in the error handler and unknown-command guard.

```ts
#!/usr/bin/env node

import { createRequire } from 'node:module';
import process from 'node:process';
import { renderHelp } from '@finografic/cli-kit/render-help';
import type { CommandHandler } from '@finografic/cli-kit/commands';

import { cliHelp } from './cli.help.js';
import { runBuildCommand } from './commands/build/index.js';
import { runDeployCommand } from './commands/deploy/index.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

async function main(): Promise<void> {
  const cwd = process.cwd();
  const [, , ...argv] = process.argv;
  const [command = '', ...args] = argv;

  if (!command || command === '--help' || command === '-h') {
    renderHelp(cliHelp);
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log(version);
    return;
  }

  const commands: Record<string, CommandHandler> = {
    build:  (p) => runBuildCommand(p),
    deploy: (p) => runDeployCommand(p),
    help:   ()  => renderHelp(cliHelp),
  };

  if (!commands[command]) {
    console.error(`Unknown command: ${command}`);
    renderHelp(cliHelp);
    process.exit(1);
    return;
  }

  await commands[command]({ argv: args, cwd });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
```

---

## Separation of Concerns

| File          | Allowed                                                                  | Not allowed                              |
| ------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| `.command.ts` | Import and call everything. `clack.intro/outro/spinner`. `process.exit`. | Business logic, raw computation          |
| `.logic.ts`   | Pure functions, types, exports                                           | `clack.*`, `console.log`, `process.exit` |
| `.prompts.ts` | `clack.*` calls, return structured data, `process.exit(0)` on cancel     | File I/O, business logic                 |
| `.output.ts`  | `clack.log.*`, `console.log`, read-only data access                      | Any writes, side effects                 |
| `.help.ts`    | `CommandHelpConfig` constant, imports from kit only                      | Logic, prompts, app imports              |
| `.types.ts`   | `interface`, `type` — no values                                          | Functions, constants, imports            |

---

## Consumer Migration Checklist

When migrating an existing `@finografic` CLI package to use `cli-kit`:

1. Add `@finografic/cli-kit` to `dependencies`.
2. Delete `src/core/` (or update the tsconfig `paths` alias to point at the kit).
3. Replace `core/flow` imports with `@finografic/cli-kit/flow`.
4. Replace `core/render-help` imports with `@finografic/cli-kit/render-help`.
5. Replace `core/file-diff` imports with `@finografic/cli-kit/file-diff`.
6. Ensure command functions match `RunCommandParams` (`{ argv, cwd }`).
7. Rename `{name}.cli.ts` → `{name}.command.ts` (naming alignment).
8. Add `index.ts` barrels to each command folder if missing.

---

## Architectural Decisions

| #   | Decision                                                          | Rationale                                                                     |
| --- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Multi-entrypoint library (subpaths) not a single barrel           | Tree-shaking, clear import intent, avoids name conflicts between modules      |
| 2   | `cwd` required in `RunCommandParams`                              | Testable, explicit, no hidden `process.cwd()` reads                           |
| 3   | `--help` handled inside each command, not in `cli.ts`             | Commands own their help content; `cli.ts` stays routing-only                  |
| 4   | `flow` created in the command, not in `cli.ts`                    | `cli.ts` doesn't know each command's flag shape                               |
| 5   | `prompts` module as `flow` subset                                 | Frictionless upgrade path — adding `-y` is two lines                          |
| 6   | Generic constraints on `computeNameWidth` / `computeVersionWidth` | Reusable across any CLI's tabular data, not just package lists                |
| 7   | `multiselectLineBreak` in `tui` (not `prompts`)                   | It's a rendering concern, not a flow/interaction concern                      |
| 8   | Root barrel exports only `commands` types                         | Avoids name conflicts between `flow` and `prompts` (`PromptSelectOpts`, etc.) |
