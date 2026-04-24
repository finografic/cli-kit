import type { Colors as PicocolorsColors } from 'picocolors/types';

type PicoColors = Extract<
  keyof PicocolorsColors,
  'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray'
>;

type PicocolorsBright = Extract<
  keyof PicocolorsColors,
  | 'blackBright'
  | 'redBright'
  | 'greenBright'
  | 'yellowBright'
  | 'blueBright'
  | 'magentaBright'
  | 'cyanBright'
  | 'whiteBright'
>;

export type PicoColor = PicoColors | PicocolorsBright;
