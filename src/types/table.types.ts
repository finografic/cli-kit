export type ColumnAlign = 'left' | 'right';

export interface ColumnDef<T> {
  key: string;

  align?: ColumnAlign;

  /**
   * Extract raw value from row
   */
  get: (row: T) => string;

  /**
   * Optional formatter (color, etc.)
   */
  format?: (value: string, row: T) => string;

  /**
   * Optional extra width offset (like your +5)
   */
  offset?: number;
}

export interface ColumnProps {
  width: number;
  align: ColumnAlign;
}

export interface TableInstance<T> {
  columns: ColumnProps[];
  render: (row: T) => string;
}
