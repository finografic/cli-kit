import type { ColumnDef, ColumnLayout, TableInstance } from 'types/table.types.js';

import { renderRow } from './row.js';
import { computeColumnWidths } from './width.js';

export function createTable<T>(
  rows: T[],
  columnDefs: ColumnDef<T>[],
  options: { gap?: number } = {},
): TableInstance<T> {
  const gap = options.gap ?? 2;

  const rawRows = rows.map((row) => columnDefs.map((col) => col.get(row)));
  const dataWidths = computeColumnWidths(rawRows);

  const columns: ColumnLayout[] = columnDefs.map((col, i) => ({
    width: dataWidths[i] + (col.padding?.left ?? 0) + (col.padding?.right ?? 0),
    align: col.align ?? 'left',
    padding: col.padding,
  }));

  const totalWidth = columns.reduce((acc, col) => acc + col.width, 0) + (columns.length - 1) * gap;

  return {
    columns,
    totalWidth,
    gap,
    renderRow(row: T) {
      const values = columnDefs.map((col) => {
        const raw = col.get(row);
        return col.format ? col.format(raw, row) : raw;
      });
      return renderRow(values, columns, gap);
    },
  };
}
