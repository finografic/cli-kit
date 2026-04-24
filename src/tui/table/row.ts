import type { ColumnDef, ColumnLayout } from 'types/table.types.js';

import { padLeft, padRight } from './padding.js';

export function renderRow<T>(
  row: T,
  columns: ColumnLayout[],
  columnDefs: ColumnDef<T>[],
  gap: number = 2,
): string {
  const values = columnDefs.map((col) => {
    const raw = col.get(row);
    return col.format ? col.format(raw, row) : raw;
  });

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
