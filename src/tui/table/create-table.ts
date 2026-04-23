import type { ColumnDef, TableInstance } from 'types/table.types.js';

import { renderRow } from './row.js';
import { computeColumnWidths } from './width.js';

export function createTable<T>(
  rows: T[],
  columnDefs: ColumnDef<T>[],
  options: { prefixWidth?: number } = {},
): TableInstance<T> {
  const prefix = ' '.repeat(options.prefixWidth ?? 0);

  const rawRows = rows.map((row) => columnDefs.map((col) => col.get(row)));

  const widths = computeColumnWidths(rawRows);

  const columns = columnDefs.map((col, i) => ({
    width: widths[i] + (col.offset ?? 0),
    align: col.align ?? 'left',
  }));

  return {
    columns,
    render(row: T) {
      const values = columnDefs.map((col) => {
        const raw = col.get(row);
        return col.format ? col.format(raw, row) : raw;
      });

      const line = renderRow(values, columns);

      // 👇 THIS is the correct fix
      return prefix + line;
    },
  };
}
