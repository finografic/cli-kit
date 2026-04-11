# @finografic/cli-kit

📅 Apr 11, 2026

> Composable CLI primitives for building consistent terminal tools across the `@finografic` ecosystem.

- Single hard dependency for every `@finografic` CLI package
- Replaces the `src/core/` copy-paste convention — modules live here, imported as a real package
- Ships TypeScript declarations; no `src/core/` folder needed in consumer projects
- Scaffolded automatically into new packages by `@finografic/genx`

---

## 📦 Installation

```bash
pnpm add @finografic/cli-kit
```

Requires a `.npmrc` pointing `@finografic` packages at the GitHub registry:

```ini
@finografic:registry=https://npm.pkg.github.com
```

---

## 🧩 Modules

Each module is a standalone subpath import. Import only what you use.

| Subpath                           | Purpose                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `@finografic/cli-kit/flow`        | Flag parsing + full interactive resolution chain (yes-mode, `-y` fast-paths)              |
| `@finografic/cli-kit/render-help` | `renderHelp()` and `renderCommandHelp()` with typed config objects                        |
| `@finografic/cli-kit/file-diff`   | Per-file unified diff display + interactive write confirmation                            |
| `@finografic/cli-kit/tui`         | Terminal layout primitives — padding, dividers, dynamic column widths, custom multiselect |
| `@finografic/cli-kit/prompts`     | Thin clack wrapper with cancel handling — no `FlowContext` required                       |
| `@finografic/cli-kit/commands`    | Shared `RunCommandParams` and `CommandHandler` types                                      |
| `@finografic/cli-kit`             | Root barrel — re-exports `commands` types only                                            |

---

## 📖 Module Reference

### `flow` — Flag parsing + interactive resolution

The `flow` module is the full-featured interactive layer for commands that support a `-y` / `--yes` fast-path. It wraps `@clack/prompts` with a **resolution chain**: flag value → yes-mode default → interactive prompt.

```ts
import { createFlowContext, promptSelect, promptText, promptConfirm } from '@finografic/cli-kit/flow';
import type { FlowContext } from '@finografic/cli-kit/flow';
```

#### Creating a flow context

```ts
const flow = createFlowContext(argv, {
  write:  { type: 'boolean' },
  target: { type: 'string', alias: 't' },
  count:  { type: 'number' },
  y:      { type: 'boolean' },
});

// flow.flags.write  → boolean
// flow.flags.target → string
// flow.flags.count  → number
// flow.yesMode      → true when -y or --yes was passed
// flow.args         → positional args (non-flag tokens)
```

Flags after `--` are collected as positional args. Repeated flags with `multi: true` accumulate into an array.

#### Prompts with the resolution chain

```ts
// Resolves as: flag value → yes-mode default → interactive prompt
const packageType = await promptSelect(flow, {
  message: 'Package type',
  options: [
    { value: 'library', label: 'Library' },
    { value: 'cli',     label: 'CLI tool' },
  ],
  default: 'library',
  flagKey: 'type',
});

const name = await promptText(flow, {
  message:  'Package name',
  flagKey:  'name',
  required: true,
});

const confirmed = await promptConfirm(flow, {
  message:     'Write files?',
  default:     true,
  skipMessage: '✓ Writing files (--yes)',
});
```

All prompt functions exit cleanly on `Ctrl+C` by default. Pass `cancelBehavior: 'skip'` to return the default instead.

#### Passing flow to prompt files

The `flow` object is created once in the command orchestrator and passed into `.prompts.ts` functions:

```ts
// update.command.ts
const flow = createFlowContext(argv, { y: { type: 'boolean' } });
const patches = await selectUpdatePatches(entries, flow);

// update.prompts.ts
import type { FlowContext } from '@finografic/cli-kit/flow';

export async function selectUpdatePatches(
  entries: DepEntryWithLatest[],
  flow: FlowContext,
): Promise<PatchInput[]> { ... }
```

---

### `render-help` — Help output

Typed config objects render consistent help pages across all CLI tools. Two render functions cover the root help page and per-command detail pages.

```ts
import { renderHelp, renderCommandHelp } from '@finografic/cli-kit/render-help';
import type { HelpConfig, CommandHelpConfig } from '@finografic/cli-kit/render-help';
```

#### Root help page

```ts
// src/cli.help.ts
import type { HelpConfig } from '@finografic/cli-kit/render-help';

export const cliHelp: HelpConfig = {
  main: { bin: 'mytool', args: '<command>' },
  commands: {
    title: 'Commands',
    list: [
      { label: 'build',  description: 'Build the project' },
      { label: 'deploy', description: 'Deploy to production' },
      { label: 'help',   description: 'Show this help message' },
    ],
  },
  footer: {
    title: 'Show Help',
    list: [{ label: 'mytool <command> --help', description: '' }],
  },
};

// src/cli.ts
renderHelp(cliHelp);
```

#### Per-command help page

```ts
// src/commands/deploy/deploy.help.ts
import type { CommandHelpConfig } from '@finografic/cli-kit/render-help';

export const deployHelp: CommandHelpConfig = {
  command:     'mytool deploy',
  description: 'Deploy the project to the target environment',
  usage:       'mytool deploy [options]',
  options: [
    { flag: '-e, --env <name>', description: 'Target environment (default: staging)' },
    { flag: '-y',               description: 'Skip confirmation prompts' },
  ],
  examples: [
    { command: 'mytool deploy',            description: 'Interactive deploy' },
    { command: 'mytool deploy -e prod -y', description: 'Deploy to prod, no prompts' },
  ],
};
```

Every command checks `--help` / `-h` as its first action and calls `renderCommandHelp(deployHelp)`.

---

### `file-diff` — Diff display + write confirmation

Used in any command that generates or patches files. Shows a coloured unified diff and lets the user confirm, skip, or approve all remaining writes in a session.

```ts
import { createDiffConfirmState, confirmFileWrite } from '@finografic/cli-kit/file-diff';
```

```ts
const state = createDiffConfirmState();

for (const file of filesToWrite) {
  const current  = await readFile(file.path, 'utf8').catch(() => '');
  const proposed = generateContent(file);

  const action = await confirmFileWrite(file.path, current, proposed, state);
  if (action !== 'skip') {
    await writeFile(file.path, proposed, 'utf8');
  }
}
```

The `state` object carries `yesAll: boolean` across iterations — once the user picks "Yes to all", subsequent files write without prompting. `renderFileDiff()` is also exported if you need to display a diff without the confirmation step.

---

### `tui` — Terminal layout primitives

Utilities for building consistent table layouts and multiselect prompts. Column widths are computed from live data rather than hardcoded, so they adapt to long names and version strings at runtime.

```ts
import {
  TUI_DEFAULTS,
  padRight, padLeft,
  createDivider,
  computeNameWidth, computeVersionWidth,
  multiselectLineBreak, isCancel,
} from '@finografic/cli-kit/tui';
```

#### Column width computation

Both compute functions are generic — they accept any type satisfying the constraint:

```ts
// T extends { name: string }
const nameWidth = computeNameWidth(items);
// narrower padding for the multiselect prompt
const nameWidth = computeNameWidth(items, TUI_DEFAULTS.multiselect.nameExtraPad);

// T extends { current: string; latest?: string | null; prefix: string }
const versionWidth = computeVersionWidth(items);
```

#### Table rendering

```ts
console.log(`  ${padRight('Package', nameWidth)}${padRight('Current', versionWidth)}Latest`);
console.log(createDivider(nameWidth + versionWidth + 10));

for (const pkg of packages) {
  console.log(`  ${padRight(pkg.name, nameWidth)}${padRight(pkg.current, versionWidth)}${pkg.latest ?? '—'}`);
}
```

#### `multiselectLineBreak`

Like `@clack/prompts`'s `multiselect`, but the submit state renders selected items one per line instead of a comma-separated inline list — cleaner for long package lists:

```ts
const result = await multiselectLineBreak({
  message: 'Select packages to update',
  options: packages.map((p) => ({
    value: p,
    label: p.name,
    hint:  `${p.current} → ${p.latest}`,
  })),
  required: true,
});

if (isCancel(result)) process.exit(0);
```

---

### `prompts` — Thin clack wrapper

For commands that have interactive steps but no `-y` fast-path. Cancel handling (`Ctrl+C` → clean exit) is built in at every call site.

```ts
import {
  promptSelect, promptMultiSelect, promptText, promptConfirm,
  createSelectOptions,
} from '@finografic/cli-kit/prompts';
import type { SelectOption } from '@finografic/cli-kit/prompts';
```

```ts
const env = await promptSelect({
  message: 'Deploy to which environment?',
  options: [
    { value: 'staging', label: 'Staging' },
    { value: 'prod',    label: 'Production', hint: 'irreversible' },
  ],
});

const features = await promptMultiSelect({
  message:       'Enable features',
  options:       featureOptions,
  initialValues: ['eslint', 'prettier'],
  minOne:        true,
});

const name = await promptText({
  message:     'Project name',
  placeholder: 'my-project',
  validate:    (v) => (!v ? 'Name is required' : undefined),
});

const go = await promptConfirm({ message: 'Continue?' });
```

#### `createSelectOptions` factory

Builds typed options arrays from domain data:

```ts
const options = createSelectOptions(packages, (pkg) => ({
  value: pkg,
  label: pkg.name,
  hint:  pkg.version,
}));
```

#### Upgrading from `prompts` to `flow`

When a command gains a `-y` fast-path, swap the import and add the `FlowContext` argument — no structural change needed. The opts interface is a direct subset of the flow opts:

```ts
// Before (prompts)
import { promptConfirm } from '@finografic/cli-kit/prompts';
const ok = await promptConfirm({ message: 'Continue?' });

// After (flow) — two changes: import path, add flow arg
import { promptConfirm } from '@finografic/cli-kit/flow';
const ok = await promptConfirm(flow, { message: 'Continue?', default: true });
```

---

### `commands` — Shared command types

The standard signature every `@finografic` command entry point must satisfy.

```ts
import type { RunCommandParams, CommandHandler, SubcommandHandler } from '@finografic/cli-kit/commands';

// Every command exports this signature
export async function runDeployCommand({ argv, cwd }: RunCommandParams): Promise<void> {
  // cwd is always passed from cli.ts — never call process.cwd() inside a command
}
```

The root `cli.ts` dispatches via a typed registry:

```ts
const commands: Record<string, CommandHandler> = {
  build:  (p) => runBuildCommand(p),
  deploy: (p) => runDeployCommand(p),
  help:   ()  => renderHelp(cliHelp),
};

if (!commands[command]) {
  console.error(`Unknown command: ${command}`);
  renderHelp(cliHelp);
  process.exit(1);
}

await commands[command]({ argv: args, cwd });
```

For commands with subcommands, use a local `SubcommandHandler` registry inside the command orchestrator. See [docs/spec/CLI_KIT.md](/docs/spec/CLI_KIT.md) for the full subcommand pattern.

---

## 🗂 File Structure Convention

Consumer packages generated by `genx` follow this layout:

```
src/
  cli.ts              # Entry: routing + lifecycle only. No business logic.
  cli.help.ts         # Root HelpConfig
  commands/
    {name}/
      index.ts              # Barrel: re-exports run{Name}Command
      {name}.command.ts     # Orchestrator: intro/outro, clack, calls helpers
      {name}.logic.ts       # Pure computation — no I/O, testable in isolation  (optional)
      {name}.prompts.ts     # clack calls, returns structured data              (optional)
      {name}.output.ts      # console.log / clack.log — read-only              (optional)
      {name}.help.ts        # CommandHelpConfig constant                        (optional)
      {name}.types.ts       # Types scoped to this command                     (optional)
```

### Separation of concerns

| File          | Allowed                                                                  | Not allowed                              |
| ------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| `.command.ts` | Import and call everything. `clack.intro/outro/spinner`. `process.exit`. | Business logic, raw computation          |
| `.logic.ts`   | Pure functions, types, exports                                           | `clack.*`, `console.log`, `process.exit` |
| `.prompts.ts` | `clack.*` calls, return structured data, `process.exit(0)` on cancel     | File I/O, business logic                 |
| `.output.ts`  | `clack.log.*`, `console.log`, read-only data access                      | Any writes, side effects                 |
| `.help.ts`    | `CommandHelpConfig` constant, imports from kit only                      | Logic, prompts, app imports              |
| `.types.ts`   | `interface`, `type` — no values                                          | Functions, constants                     |

---

## 🛠 Development

```bash
pnpm install     # install deps + git hooks
pnpm dev         # build in watch mode (tsdown --watch)
pnpm build       # production build — 7 entry points
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm test:run    # vitest run
```

### Adding a new module

1. Create `src/{module}/` with implementation files and an `index.ts` barrel.
2. Add the entry to `tsdown.config.ts` under `entry`.
3. Add the subpath to the `exports` map in `package.json`.
4. Re-export root-level shared types from `src/index.ts` if appropriate.

### Publishing

```bash
pnpm release:check            # format + lint + typecheck + tests
pnpm version patch|minor      # bump version + git tag
git push --follow-tags
pnpm release:publish          # pnpm publish --registry https://npm.pkg.github.com
```

---

## 📄 License

MIT © [Justin Rankin](https://github.com/finografic)
