# DONE — Unblock install

> **Completed:** 2026-08-18 — `@finografic/oxfmt-config` replaced; install, format, and pre-commit work again.

📅 2026-08-18

## Summary

`pnpm install` 404ed on the removed `@finografic/oxfmt-config` package. The repo now depends on `@finografic/oxc-config`, matches toolchain policy, and uses oxlint instead of ESLint so TypeScript 7 does not crash the husky hook.

## Done

- [x] Swap `@finografic/oxfmt-config` → `@finografic/oxc-config` `^2.9.1` and import from `@finografic/oxc-config/oxfmt`
- [x] Rename `update:oxfmt-config` → `update:oxc-config`
- [x] `pnpm install` with pnpm 11; `pnpm approve-builds --all`
- [x] `genx deps --yes` — `packageManager` `pnpm@11.21.0`, `engines.node` `>=24.19.0`, `.nvmrc` `24.19.0`
- [x] Exclude freshly published `@finografic/oxc-config@2.9.0 || 2.9.1` from `minimumReleaseAge`
- [x] Delete `Icon\r` artifacts; restore `Icon?` in `.gitignore`
- [x] Move lint to oxlint (`oxlint.config.ts`, drop ESLint deps); lint-staged uses `oxlint --fix`

## Notes

Steps 1–2 alone did not restore the hook: ESLint 9 + `typescript-eslint` 8 crash on TypeScript 7 (`Cannot read properties of undefined (reading 'Cjs')`). The oxlint switch in this repo was required for `lint-staged` to pass on `.ts` files.

`pnpm lint` exits 0 with remaining warnings (`typescript/array-type`, unnecessary assertions). Not blocking.

## Validation

- `pnpm install` — pnpm 11.21.0
- `pnpm lint` — 0 errors
- `pnpm typecheck` — OK
- `pnpm exec lint-staged` — oxfmt + oxlint on staged TS/JSON
- `pnpm test:run` — no test files in this package
