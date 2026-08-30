# TODO — Live-dashboard primitives (Phase 2)

> **Blocked.** Do not start until `genx managed live` has shipped and is in real use.
>
> Source of truth: [`@finografic/genx` → `docs/todo/TODO_MANAGED_LIVE_DASHBOARD.md`](https://github.com/finografic/genx).

Extract the reusable parts of genx's live alignment dashboard into the kit, once a second consumer
actually wants them.

---

## Why this is blocked rather than scoped

`gli live` and `genx managed live` will look similar — a refreshing table over a set of repos, with
row actions. The temptation is to design the shared API first and build both on top.

Do not. There is exactly one implementation today (`gli live`) and one design (genx's). An API drawn
from one real consumer and one imagined one gets the seams wrong, and the kit then carries a public
surface that neither side quite fits.

This is the same reasoning that keeps
[`TODO_CLI_KIT_MANAGED_LOOP_REVIEW.md`](https://github.com/finografic/genx) open in genx rather than
resolved: _"generic enough to move, or still too genx-specific"_ is answerable from two real
implementations and guesswork from one.

---

## Trigger

Start when **both** hold:

- `genx managed live` has shipped and survived real use
- `gli` has a concrete reason to change — a column, an interaction, or a bug that would be fixed in
  both places

Until then, duplication between the two dashboards is the cheaper option. Two copies that diverge
are a smaller problem than one abstraction that fits neither.

---

## Candidates, in rough order of confidence

Recorded now so the eventual review has a starting list. None are commitments.

| Candidate                      | Confidence | Note                                                                        |
| ------------------------------ | ---------- | --------------------------------------------------------------------------- |
| XDG-cached multi-select        | high       | "remember which repos I picked" is generic; already `/xdg` + `/tui` work    |
| Tiered refresh loop            | medium     | cheap vs expensive columns, visible staleness — both dashboards need it     |
| Git ahead/behind + dirty count | medium     | pure git, no domain logic; genx has it in `lib/git/target-git-status.utils` |
| Row actions on a focused row   | low        | action sets differ sharply between PRs and packages                         |
| Column definitions             | none       | `/tui` `ColumnDef<T>` already covers this — nothing new needed              |

The refresh loop is the one to look at hardest. gli already has
`DEFAULT_CACHE_MAX_AGE_SECONDS` / `DEFAULT_LIVE_INTERVAL_SECONDS`, and genx will need the same split
for its expensive deps column. If those two land on the same shape independently, that is the signal.

---

## Scope guards

- **No config loading.** Each CLI owns its own target list — genx reads
  `~/.config/finografic/genx.config.jsonc`, gli reads its own `repos: []`. The kit must not learn
  about either.
- **No domain logic.** Nothing about policy, dependencies, PRs or Jira.
- **Reporting stays with the caller.** Same rule the managed loop already follows: only the caller
  knows what a given state means for its flow.

---

## Related

- [`ROADMAP.md` → `cli-kit/tui` — Live dashboard / polling renderer](./ROADMAP.md) — the standing
  Galaxy-brained entry this document is the detail for. It already called for extracting gli's
  implementation and generalising from a second consumer; genx is that consumer.
- [`TODO_MIGRATE_TO_CLI_KIT.md`](https://github.com/finografic/genx) — the wider genx → cli-kit
  migration this would eventually join
- Phase 3 consumer: [`@finografic/gli` → `TODO_ADOPT_LIVE_PRIMITIVES.md`](https://github.com/finografic/gli)
