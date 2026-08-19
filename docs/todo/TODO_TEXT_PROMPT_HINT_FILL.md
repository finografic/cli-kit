# TODO: Fill a text prompt's hint with Tab or Right-arrow

**Status:** Planned — not started
**Owner:** Finografic tooling
**Related:** `src/flow/flow.utils.ts` (`promptText`), `src/tui/tui.multiselect.ts` (the precedent)

---

## Purpose

`promptText` shows a `placeholder` / `default`, but there is no way to _accept_ it except by retyping
it. Pressing Tab or Right-arrow on an empty line should fill the input with that hint and put the
cursor at the end, so it can then be edited rather than only accepted wholesale by pressing Enter.

This has been looked into more than once. Worth recording why it keeps stalling: it cannot be done
by passing another option to `clack.text`.

---

## Why a wrapper is required

`promptText` is currently a thin wrapper over `@clack/prompts`' `text`, and two upstream behaviours
block the feature at that level:

1. **`placeholder` is visual only.** `@clack/core` renders it as dim text and never copies it into
   `userInput`. Only `defaultValue` reaches the result, and only when the user submits an empty
   line — there is no keystroke that materialises it for editing.
2. **Tab is consumed before it can be observed.** For tracked prompts, `@clack/core` maps Tab
   through its readline handling rather than surfacing it as a plain key, so a naive
   `on('key', …)` listener never sees a usable Tab.

So the fix is a custom prompt built on `@clack/core`'s `TextPrompt`, not a config change.

**There is already a precedent for exactly this shape in this package:**
`src/tui/tui.multiselect.ts` builds on `@clack/core`'s `MultiSelectPrompt` for the same class of
reason (clack's own `multiselect` hardcodes its label styler and exposes no hook). Follow its
structure — options interface, per-option renderer, exported factory, re-export from
`src/tui/index.ts`.

---

## API surface (verified against `@clack/core` 1.2.x)

```ts
declare class TextPrompt extends Prompt<string> {
  get userInputWithCursor(): string;
  get cursor(): number;
  constructor(opts: TextOptions); // { placeholder?, defaultValue?, ...PromptOptions }
}
```

From the `Prompt<string>` base, the pieces this needs:

| Member                                      | Use                                   |
| ------------------------------------------- | ------------------------------------- |
| `userInput: string`                         | current line — the thing to fill      |
| `value: string \| undefined`                | resolved result                       |
| `_cursor: number` (protected)               | move to end after filling             |
| `on('key', (char, info: Key) => void)`      | intercept Tab / Right-arrow           |
| `on('finalize' \| 'submit' \| 'cancel', …)` | lifecycle, as in `tui.multiselect.ts` |

---

## Plan

1. **`src/tui/tui.text.ts`** — a `TextPrompt` subclass or factory that:
   - accepts `message`, `placeholder`, `defaultValue`, `validate`
   - on Tab **or** Right-arrow, **only when `userInput` is empty** and a hint exists, sets
     `userInput` to the hint and moves the cursor to the end
   - leaves Right-arrow alone once the line is non-empty, so ordinary cursor movement still works
   - renders to match `@clack/prompts`' `text` (reuse `S_BAR`, `S_BAR_END`, `symbol` from
     `@clack/prompts`, as `tui.multiselect.ts` already does)
2. **Export** from `src/tui/index.ts`.
3. **Wire `promptText`** — see the decision below.
4. **Tests** — `src/flow/flow.utils.test.ts` has the existing patterns to follow.
5. Release, then bump the dependency in consumers.

---

## Decision that determines whether consumers inherit it

**Make `promptText` itself use the new prompt whenever a `placeholder` or `default` is present.**
Do _not_ add a separate `promptTextWithHint` export.

The difference is whether consumers get the behaviour for free:

| Approach                         | Consumer change needed          |
| -------------------------------- | ------------------------------- |
| `promptText` gains it internally | none — just bump the dependency |
| new separate export              | every call site must be edited  |

The config shape does not need to change: `PromptTextOpts` already carries both `placeholder` and
`default`, so existing calls light up untouched. Falling back to plain `clack.text` when neither is
set keeps the no-hint path on well-tested upstream code.

### What genx inherits, concretely

Six call sites already route through `promptText` and would gain it with no code change:

| File                                         | Prompts                  |
| -------------------------------------------- | ------------------------ |
| `src/lib/prompts/package-manifest.prompt.ts` | scope, name, description |
| `src/lib/prompts/author.prompt.ts`           | author name, email, URL  |

Two call sites bypass cli-kit and call `@clack/prompts` directly, so they would **not** inherit —
they need converting to `promptText` separately:

- `src/lib/prompts/package-description.prompt.ts`
- `src/commands/managed/managed.status.commit.ts` (commit message; `placeholder:
'type(scope): subject'`)

Worth converting both as part of adopting the release, otherwise the behaviour is inconsistent
across prompts in the same command.

---

## Acceptance

- [ ] Tab on an empty line fills the hint; the cursor sits at the end and the text is editable
- [ ] Right-arrow on an empty line does the same
- [ ] Right-arrow on a non-empty line moves the cursor as usual, filling nothing
- [ ] With no `placeholder` and no `default`, behaviour is unchanged from `clack.text`
- [ ] Submitting an empty line still yields `defaultValue`, as today
- [ ] Ctrl-C still cancels through `isCancel`, changing nothing
- [ ] `validate` runs against the filled value, not the empty line
