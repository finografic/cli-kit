import { stringWidth } from './width.js';

export function padRight(value: string, width: number): string {
  const len = stringWidth(value);
  return value + ' '.repeat(Math.max(0, width - len));
}

export function padLeft(value: string, width: number): string {
  const len = stringWidth(value);
  return ' '.repeat(Math.max(0, width - len)) + value;
}
