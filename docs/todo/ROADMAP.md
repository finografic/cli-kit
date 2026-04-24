# @finografic/cli-kit — Roadmap

📅 Apr 24, 2026

Next steps, recommended additions, and speculative ideas for the kit. Divided into three tiers: **Near-term** (clear need, low risk), **Mid-term** (good value, moderate effort), and **Galaxy-brained** (high upside, investigate before committing).

---

## ✅ Shipped — v0.1.0

| Module         | Export(s)                                                  | Notes                                |
| -------------- | ---------------------------------------------------------- | ------------------------------------ |
| `/paths`       | `tildeify`, `resolveTargetDir`                             | New subpath                          |
| `/xdg`         | `getConfigPath`, `getCachePath`, `readJsonc`, `writeJsonc` | New subpath; adds `jsonc-parser` dep |
| `/render-help` | `renderSection`                                            | Added to existing subpath            |
| `/flow`        | `requireArg`, `optionalArg`                                | Added to existing subpath            |

## ✅ Shipped — v0.3.x

| Module         | Export(s)                                          | Notes                                                        |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| `/tui`         | `column`, `createTable`, `formatCell`, `renderRow` | Full table system with generic `ColumnDef<T>`                |
| `/tui`         | `renderSectionTitle`                               | Section title + divider, dim by default, margin-aware        |
| `/tui`         | `stringWidth`, `padLeft`, `padRight`               | ANSI-aware; consolidated from two split implementations      |
| `/render-help` | `withHelp`                                         | Help guard wrapper, eliminates per-command boilerplate       |
| `types/`       | `PicoColor`                                        | Picocolors color string union, used in `SectionTitleOptions` |

---

## 🔵 Mid-term — Worth Adding When the Need Is Clear

### `spinner` wrapper

Every command that does async work reinvents the spinner + error handling pattern. A thin wrapper that returns a typed result reduces boilerplate:

```ts
// @finografic/cli-kit/spinner (or promote to flow/prompts)
export async function withSpinner<T>(
  message: string,
  task: () => Promise<T>,
  options?: { errorMessage?: (err: unknown) => string },
): Promise<T>
```

Internally wraps `clack.spinner()`, starts/stops on success, calls `clack.log.error` and `process.exit(1)` on failure. The `errorMessage` callback lets callers produce friendly messages without a try-catch at every call site.

### `tui` — table header row separator

`renderHeaders()` currently returns a plain dim row. Adding an optional underline / separator line between headers and data rows would complete the visual pattern for multi-group tables.

### `tui` — `renderStatusBadge`

A single-line coloured status indicator reused in `gli` and `deps-policy`:

```ts
export function renderStatusBadge(label: string, status: 'ok' | 'warn' | 'error' | 'skip'): string
// Returns e.g. pc.green('✓') + ' ' + label, or pc.yellow('⚠') + ' ' + label
```

### Testing utilities

Commands are hard to unit test today because prompts and output are interleaved. A lightweight test helper module:

```ts
// @finografic/cli-kit/testing  (devDependency / test-only export)
export function mockFlow(overrides?: Partial<FlowContext>): FlowContext
// Returns a FlowContext with yesMode: true, empty flags, empty args — useful for logic tests.

export function createTestRunParams(overrides?: Partial<RunCommandParams>): RunCommandParams
// Returns { argv: [], cwd: '/tmp' } with optional overrides — eliminates boilerplate in command tests.
```

### `render-help` — auto-generated commands table from `CommandHelpConfig[]`

Instead of manually maintaining the commands list in `cli.help.ts`, derive it from the per-command help configs:

```ts
export function helpConfigFromCommands(
  meta: { bin: string; args?: string },
  commandHelps: CommandHelpConfig[],
  footer?: HelpNote,
): HelpConfig
// Builds HelpConfig.commands.list automatically from commandHelps[].command + commandHelps[].description
```

---

## 🌌 Galaxy-brained — Investigate Before Committing

These are larger architectural ideas worth exploring but with real trade-offs. Each one is a conversation, not a plan.

### Prompt session recorder / replayer

**The idea:** Record a complete interactive session (all prompt inputs + outputs) to a JSON fixture. Replay it in tests without a TTY — like a VCR for clack.

**Why it's interesting:** The current testing story for commands is "mock everything" or "don't test". A recorder would let you test real command flows in CI without interactive input, and produce golden snapshots that catch regression in prompt wording or ordering.

**The trade-off:** Requires either patching clack at a low level or wrapping every prompt call through the kit (which the kit already does for `flow` — but not for direct clack usage in consumer code). Best prototyped in a single command (`update`) before generalising.

### Kit-level ESLint plugin: `eslint-plugin-cli-kit`

**The idea:** An ESLint plugin that enforces the separation-of-concerns rules at lint time:

- `no-clack-in-logic` — error if `.logic.ts` imports from `@clack/*`
- `no-process-exit-in-prompts` — error if `.prompts.ts` calls `process.exit` outside the cancel guard
- `no-direct-process-cwd` — error if a command file calls `process.cwd()` instead of using the injected `cwd`
- `require-command-barrel` — warn if a `commands/{name}/` folder has no `index.ts`

**Why it's interesting:** The separation-of-concerns table exists today as documentation. Making it machine-enforced means violations surface at `pnpm lint` time, not in code review.

**The trade-off:** File-name-aware linting requires custom AST rules with file path context. Feasible but non-trivial.

### Universal `--dry-run` support baked into `flow`

**The idea:** Add a `dryRun` boolean to `FlowContext`, automatically set when `--dry-run` is passed. All file-write operations in `file-diff` and any custom writes could check `flow.dryRun` instead of each command reinventing it.

**Why it's interesting:** Every generator-style command (`genx create`, `genx migrate`) would benefit. Today each command implements `--dry-run` independently — or skips it entirely.

**The design question:** `confirmFileWrite` currently has no knowledge of `FlowContext`. Wiring this in requires either passing `flow` to `confirmFileWrite` (changes the API) or making `dryRun` a separate opt on `DiffConfirmState`. The latter is cleaner.

### `cli-kit/config` — Typed, validated CLI configuration layer

**The idea:** A Zod-based config module for CLIs that need persistent user config (like `gli`). The consumer defines a schema; the kit handles loading, validation, and migration:

```ts
// @finografic/cli-kit/config
export function defineConfig<T>(schema: ZodSchema<T>): ConfigManager<T>

interface ConfigManager<T> {
  read(appName: string): Promise<T | null>
  write(appName: string, data: T): Promise<void>
  validate(raw: unknown): T                  // throws ZodError on invalid
  migrate(raw: unknown, migrations: MigrationMap): T
}
```

**Why it's interesting:** Config management is the most-duplicated non-trivial logic across `gli` and any future config-driven tool. Combining XDG paths + JSONC I/O + Zod validation + versioned migrations into one module eliminates a real class of bugs (schema drift, silent parse failures).

**The trade-off:** Adds `zod` as a runtime dependency of `cli-kit`. Potentially acceptable given `zod` is already in `genx` and `deps-policy`. Worth gating behind its own subpath (`cli-kit/config`) so it doesn't bloat consumers that don't need it.

### `cli-kit/tui` — Live dashboard / polling renderer

**The idea:** Promote `gli`'s live-dashboard polling pattern (interval-based rerender, hotkeys, clickable links) into a kit module. A `createDashboard` primitive that manages the render loop, hotkey registry, and clean exit:

```ts
export function createDashboard(opts: {
  render: () => string;
  interval: number;
  hotkeys?: Record<string, () => void | Promise<void>>;
  onExit?: () => void;
}): { start: () => void; stop: () => void }
```

**Why it's interesting:** `gli` built this from scratch and it's genuinely reusable. Any monitoring-style CLI (`status`, `watch`, `tail`) would benefit. The pattern is proven.

**The trade-off:** The live-render approach depends on terminal raw mode and ANSI escape sequences — meaningfully different from the one-shot clack flow. It might warrant its own peer dependency or a more opinionated abstraction. Start with extracting `gli`'s implementation verbatim, then generalise from a second consumer.
