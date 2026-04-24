import { stringWidth } from 'tui/padding.js';

import type { ColumnDef } from 'types/table.types.js';

export function computeColumnWidths<T>(data: T[], columnDefs: ColumnDef<T>[]): number[] {
  return columnDefs.map((col) => {
    const values = data.map((item) => col.get(item));
    return Math.max(...values.map(stringWidth));
  });
}
