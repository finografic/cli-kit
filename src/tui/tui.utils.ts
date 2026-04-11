import pc from 'picocolors';

import { TUI_DEFAULTS } from './tui.constants.js';

// ─── Primitives ──────────────────────────────────────────────────────────────

export function padLeft(value: string, width: number): string {
  return ' '.repeat(Math.max(0, width - value.length)) + value;
}

export function padRight(value: string, width: number): string {
  return value + ' '.repeat(Math.max(0, width - value.length));
}

export function createDivider(width: number): string {
  return pc.dim('  ' + '─'.repeat(width));
}

// ─── Column width computation ─────────────────────────────────────────────────

/**
 * Compute the name column width from live data, floored at TUI_DEFAULTS.name.min. Pass a custom `extraPad` to
 * override the default (e.g. for the multiselect prompt).
 */
export function computeNameWidth<T extends { name: string }>(
  entries: T[],
  extraPad: number = TUI_DEFAULTS.name.extraPad,
): number {
  if (entries.length === 0) return TUI_DEFAULTS.name.min;
  const max = Math.max(...entries.map((e) => e.name.length));
  return Math.max(TUI_DEFAULTS.name.min, max) + extraPad;
}

/**
 * Compute the version column width from live data, floored at TUI_DEFAULTS.version.min. Pass a custom
 * `extraPad` to override the default.
 */
export function computeVersionWidth<T extends { current: string; latest?: string | null; prefix: string }>(
  entries: T[],
  extraPad: number = TUI_DEFAULTS.version.extraPad,
): number {
  if (entries.length === 0) return TUI_DEFAULTS.version.min;
  const max = Math.max(
    ...entries.flatMap((e) => [e.current.length, e.latest != null ? `${e.prefix}${e.latest}`.length : 0]),
  );
  return Math.max(TUI_DEFAULTS.version.min, max) + extraPad;
}
