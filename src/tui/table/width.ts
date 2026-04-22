import stripAnsi from 'strip-ansi';

export function stringWidth(value: string): number {
  return stripAnsi(value).length;
}

export function computeColumnWidths(rows: string[][]): number[] {
  const widths: number[] = [];

  for (const row of rows) {
    row.forEach((cell, i) => {
      const len = stringWidth(cell);
      widths[i] = Math.max(widths[i] ?? 0, len);
    });
  }

  return widths;
}
