import type { ColumnLayout } from 'types/table.types.js';

import { padLeft, padRight } from './padding.js';

export function renderRow(values: string[], columns: ColumnLayout[], gap: number = 2): string {
  return values
    .map((val, i) => {
      const col = columns[i];
      const padL = col.padding?.left ?? 0;
      const padR = col.padding?.right ?? 0;
      const innerWidth = col.width - padL - padR;
      const aligned = col.align === 'right' ? padLeft(val, innerWidth) : padRight(val, innerWidth);
      return ' '.repeat(padL) + aligned + ' '.repeat(padR);
    })
    .join(' '.repeat(gap));
}
