import type { ColumnLayout } from 'types/table.types.js';

import { formatCell } from './cell.js';

export function renderRow(values: string[], columns: ColumnLayout[], gap = 2): string {
  return values.map((val, i) => formatCell(val, columns[i])).join(' '.repeat(gap));
}
