import { padLeft, padRight } from 'tui/padding.js';

import type { ColumnLayout } from 'types/table.types.js';

export function formatCell(value: string, col: ColumnLayout): string {
  const padL = col.padding?.left ?? 0;
  const padR = col.padding?.right ?? 0;
  const innerWidth = col.width - padL - padR;
  const aligned = col.align === 'right' ? padLeft(value, innerWidth) : padRight(value, innerWidth);
  return ' '.repeat(padL) + aligned + ' '.repeat(padR);
}
