import pc from 'picocolors';

import type { PicoColor } from 'types/color.types.js';

export interface SectionTitleOptions {
  color?: PicoColor;
  dividerColor?: PicoColor;
  margin?: string;
  dividerChar?: string;
}

export function renderSectionTitle(
  name: string,
  width: number,
  options: SectionTitleOptions = { color: 'cyan' },
): void {
  const color = options.color ?? 'cyan';
  const dividerColor = options.dividerColor ?? color;
  const margin = options.margin ?? '';
  const dividerChar = options.dividerChar ?? '─';

  console.log(pc[color](pc.dim(`${margin}${name}`)));
  console.log(pc[dividerColor](pc.dim(`${margin}${dividerChar.repeat(width)}`)));
}
