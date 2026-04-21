---
name: scaffold-core-module
description: Add or modify a shared CLI submodule in @finografic/cli-kit (new tsdown entry + exports), OR migrate a consumer CLI off local src/core onto kit subpaths. Use when extending the kit, publishing a new subpath, or replacing vendored core copies.
trigger: User asks to add a cli-kit module, new cli-kit subpath, extend @finografic/cli-kit, replace src/core, or sync portable CLI infrastructure across finografic CLIs
tools: [file-read, file-edit, terminal]
---

# Scaffold / maintain shared CLI infrastructure

**Important split:**

| Where the code belongs                                    | What to do                                                                                                                                                                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shared across Finografic CLIs**                         | Implement in **`@finografic/cli-kit`** (this repository). Add `src/{module}/`, wire `tsdown.config.ts` `entry`, add `package.json` `exports`, run `pnpm build` + tests. See `README.md` → “Adding a new module”.                  |
| **Migrating a consumer repo** (genx, gli, deps-policy, …) | Follow **`@finografic/genx/.github/skills/migrate-to-cli-kit`** — replace `src/core/*` and path aliases with `@finografic/cli-kit/*` imports; do **not** add new `src/core/` folders in consumer apps for cross-cutting concerns. |

Use **`docs/spec/CLI_KIT.md`** in this repo as the authoritative module contract.

## Read first (cli-kit maintainers)

- `README.md` — module list and consumer import examples.
- `docs/spec/CLI_KIT.md` — full API and architectural decisions.
- `tsdown.config.ts` — entrypoint map for each published subpath.

## Procedure — new **cli-kit** subpath

1. **Choose a kebab-case folder** under `src/{module-name}/`.

2. **Create files** (minimum pattern):
   - `{module-name}.utils.ts` (and/or focused files) — implementation.
   - `index.ts` — **barrel only** public API; named re-exports, no default exports.

3. **Implementation constraints (kit code):**
   - Top-level exported functions: prefer **`function` keyword** with explicit return types where the repo already does so.
   - **Named exports only** through the barrel.
   - Relative imports inside the module use **`.js` extensions** where required by `verbatimModuleSyntax`.
   - **Picocolors:** `import pc from 'picocolors'` — never import styling from consumer repo aliases.

4. **Build wiring:** add the entry to `tsdown.config.ts` under `entry`, and add the subpath to `package.json` `exports`.

5. **Tests:** add or extend Vitest coverage under `src/{module}/` or `test/` per repo convention.

6. **Publish:** follow `README.md` release / publish notes; consumer repos bump `@finografic/cli-kit` when they need the new surface.

## Procedure — consumer repo still on `src/core/`

Do **not** use this skill to grow **new** `src/core/` copies. Use **`migrate-to-cli-kit`** in genx to delete local `flow/`, `render-help/`, etc., and depend on the published kit.

## Related skills

- **migrate-to-cli-kit** (in `@finografic/genx`) — full consumer migration (including optional xdg / async config steps).
- **scaffold-cli-help** (this repo) — root `HelpConfig` only; uses `@finografic/cli-kit/render-help`.
