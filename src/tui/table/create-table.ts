import pc from 'picocolors';

import type { ColumnDef, ColumnLayout, TableInstance } from 'types/table.types.js';

import { renderRow } from './row.js';
import { computeColumnWidths } from './width.js';

export function createTable<T>(
  data: T[],
  columnDefs: ColumnDef<T>[],
  options: { gap?: number } = {},
): TableInstance<T> {
  const gap = options.gap ?? 2;

  const dataWidths = computeColumnWidths(data, columnDefs);

  const columns: ColumnLayout[] = columnDefs.map((col, i) => ({
    width: dataWidths[i] + (col.padding?.left ?? 0) + (col.padding?.right ?? 0),
    align: col.align ?? 'left',
    padding: col.padding,
  }));

  const totalWidth = columns.reduce((acc, col) => acc + col.width, 0) + (columns.length - 1) * gap;

  const labels = columnDefs.map((col) => col.label ?? col.key);

  return {
    columns,
    gap,
    totalWidth,
    renderRow(row: T) {
      const values = columnDefs.map((col) => {
        const raw = col.get(row);
        return col.format ? col.format(raw, row) : raw;
      });
      return renderRow(values, columns, gap);
    },
    renderHeaders() {
      return pc.dim(renderRow(labels, columns, gap));
    },
  };
}
