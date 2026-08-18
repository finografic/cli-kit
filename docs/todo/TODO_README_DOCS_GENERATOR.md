# TODO — README Docs Generator

> **Status:** Not started (2026-05-26). Pattern proven in `@finografic/genx`.

## Goal

Extract the `CommandHelpConfig` → Markdown conversion pattern from genx into a reusable module in `@finografic/cli-kit`, so any CLI project can generate rich README command documentation from its existing help configs.

## Background

`@finografic/genx` now generates per-command README sections directly from `CommandHelpConfig` objects (the same data used for `--help` output). The converter maps each field to markdown:

| `CommandHelpConfig` field | Markdown element                    |
| ------------------------- | ----------------------------------- |
| `command`                 | `### genx create` heading           |
| `description`             | Paragraph after heading             |
| `usage`                   | Fenced code block                   |
| `options`                 | Table (Flag / Description)          |
| `subcommands`             | Table (Subcommand / Description)    |
| `examples`                | Fenced code block with `#` comments |
| `howItWorks`              | Numbered list                       |
| `sections`                | Bold heading + content              |

This means help content is single-sourced: update the `*.help.ts` file, both CLI `--help` and README update automatically.

## What to extract

### Pure functions (no I/O)

- `commandHelpToMarkdown(config: CommandHelpConfig): string` — convert one command help config to a markdown section
- `rootHelpToCommandsTable(rootHelp: HelpConfig, commandHelps: Map<string, CommandHelpConfig>): string` — generate a commands reference table with options derived from help configs
- `replaceBetweenMarkers(content: string, start: string, end: string, replacement: string): string` — generic marker-based section stitcher

### Types

- Re-export or extend `CommandHelpConfig` / `HelpConfig` if the markdown contract needs additional fields
- Consider a `ReadmeGeneratorConfig` type for the scaffold script configuration

### Optional: scaffold script or bin

A consumer-side script generator (or a bin like `cli-kit generate-readme`) that wires the above functions together. Configuration would be minimal:

```ts
{
  binName: 'genx',
  commands: [
    { name: 'create', help: createHelp },
    // ...
  ],
  rootHelp: cliHelp,
  readmePath: 'README.md',
  markers: {
    usage: ['<!-- GENERATED:USAGE:START -->', '<!-- GENERATED:USAGE:END -->'],
    commandsRef: ['<!-- GENERATED:COMMANDS_REF:START -->', '<!-- GENERATED:COMMANDS_REF:END -->'],
  },
}
```

## Subpath export

Suggest `@finografic/cli-kit/readme-gen` or `@finografic/cli-kit/docs-gen` as the subpath.

## Reference implementation

- `@finografic/genx` — `scripts/generate-readme-usage.ts` (the working pattern to extract from)

## Checklist

- [ ] Extract `commandHelpToMarkdown` to cli-kit
- [ ] Extract `replaceBetweenMarkers` to cli-kit
- [ ] Extract commands reference table generator to cli-kit
- [ ] Add subpath export
- [ ] Add tests for the converter (snapshot-style)
- [ ] Update genx to consume from cli-kit instead of local implementation
- [ ] Update docs / CLI_CORE.md with the new module
