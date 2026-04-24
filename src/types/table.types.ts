export type ColumnAlign = 'left' | 'right';

export interface ColumnPadding {
  left?: number;
  right?: number;
}

export interface ColumnDef<T> {
  key: string;
  label?: string;
  align?: ColumnAlign;
  /** Extra whitespace injected inside the column cell (left/right of content). Increases column width. */
  padding?: ColumnPadding;
  get: (row: T) => string;
  format?: (value: string, row: T) => string;
}

export interface ColumnLayout {
  width: number;
  align: ColumnAlign;
  padding?: ColumnPadding;
}

export interface TableInstance<T> {
  columns: ColumnLayout[];
  renderRow: (row: T) => string;
  renderHeaders: () => string;
  gap: number;
  /** Total rendered width: sum of column widths + (n − 1) × gap. */
  totalWidth: number;
}
