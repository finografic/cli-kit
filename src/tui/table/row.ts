import type { ColumnProps } from 'types/table.types.js';

import { padLeft, padRight } from './padding.js';

export function renderRow(values: string[], columns: ColumnProps[]): string {
  return values
    .map((val, i) => {
      const col = columns[i];
      return col.align === 'right' ? padLeft(val, col.width) : padRight(val, col.width);
    })
    .join('  ');
}
