import type { ColumnDef } from 'types/table.types.js';

export function column<T>(key: string, def: Omit<ColumnDef<T>, 'key'>): ColumnDef<T> {
  return { key, ...def };
}
