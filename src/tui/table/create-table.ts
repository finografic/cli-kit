import type { ColumnDef, TableInstance } from 'types/table.types.js';

import { renderRow } from './row.js';
import { computeColumnWidths } from './width.js';

export function createTable<T>(rows: T[], defs: ColumnDef<T>[]): TableInstance<T> {
  // 1. extract raw values (no formatting yet)
  const rawRows = rows.map((row) => defs.map((col) => col.get(row)));

  // 2. compute widths
  const widths = computeColumnWidths(rawRows);

  // 3. build columns config
  const columns = defs.map((def, i) => ({
    width: widths[i] + (def.offset ?? 0),
    align: def.align ?? 'left',
  }));

  // 4. render function (this is the key)
  function render(row: T): string {
    const values = defs.map((def, _i) => {
      const raw = def.get(row);
      return def.format ? def.format(raw, row) : raw;
    });

    return renderRow(values, columns);
  }

  return {
    columns,
    render,
  };
}
