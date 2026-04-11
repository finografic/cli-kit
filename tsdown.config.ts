import { defineConfig } from 'tsdown';

export default defineConfig({
  exports: { legacy: true },
  entry: {
    'index': 'src/index.ts',
    'flow': 'src/flow/index.ts',
    'render-help': 'src/render-help/index.ts',
    'file-diff': 'src/file-diff/index.ts',
    'tui': 'src/tui/index.ts',
    'prompts': 'src/prompts/index.ts',
    'commands': 'src/commands/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'esnext',
});
