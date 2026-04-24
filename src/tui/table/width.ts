import stripAnsi from 'strip-ansi';

import type { ColumnDef } from 'types/table.types';

export function stringWidth(value: string): number {
  return stripAnsi(value).length;
}

export function computeColumnWidths<T>(data: T[], columnDefs: ColumnDef<T>[]): number[] {
  return columnDefs.map((col) => {
    const values = data.map((item) => col.get(item));
    return Math.max(...values.map(stringWidth));
  });
}
