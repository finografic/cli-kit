import type { ColumnDef, TableInstance } from 'types/table.types.js';

import { renderRow } from './row.js';
import { computeColumnWidths } from './width.js';

export function createTable<T>(
  rows: T[],
  columnDefs: ColumnDef<T>[],
  options: { prefixWidth?: number } = {},
): TableInstance<T> {
  const prefixWidth = options.prefixWidth ?? 0;

  // 1. extract raw values (no formatting yet)
  const rawRows = rows.map((row) => columnDefs.map((col) => col.get(row)));

  // 2. compute widths
  const widths = computeColumnWidths(rawRows);

  // 3. build columns config
  const columns = columnDefs.map((col, i) => ({
    width: widths[i] + (col.offset ?? 0) + (i === 0 ? prefixWidth : 0), // 👈 KEY LINE
    align: col.align ?? 'left',
  }));

  return {
    columns,
    render(row: T) {
      return renderRow(
        columnDefs.map((col) => {
          const raw = col.get(row);
          return col.format ? col.format(raw, row) : raw;
        }),
        columns,
      );
    },
  };
}
