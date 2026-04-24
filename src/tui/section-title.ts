import pc from 'picocolors';

export interface SectionTitleOptions {
  color?: (s: string) => string;
  dividerColor?: (s: string) => string;
  margin?: string;
  dividerChar?: string;
}

export function renderSectionTitle(name: string, width: number, options: SectionTitleOptions = {}): void {
  const color = options.color ?? pc.dim;
  const dividerColor = options.dividerColor ?? pc.dim;
  const margin = options.margin ?? '';
  const dividerChar = options.dividerChar ?? '─';

  console.log(color(`${margin}${name}`));
  console.log(dividerColor(`${margin}${dividerChar.repeat(width)}`));
}
