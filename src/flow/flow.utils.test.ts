import { describe, expect, it } from 'vitest';

import { createFlowContext, optionalArg, requireArg } from './flow.utils.js';

const flags = {
  name: { type: 'string' as const, alias: 'n' },
  count: { type: 'number' as const },
  verbose: { type: 'boolean' as const, alias: 'v' },
  include: { type: 'string' as const, multi: true },
};

describe('createFlowContext', () => {
  it('parses long flags, aliases, positionals, and yes-mode', () => {
    const flow = createFlowContext(['--name', 'kit', '-v', '--count', '3', '-y', 'rest'], flags);

    expect(flow.flags.name).toBe('kit');
    expect(flow.flags.verbose).toBe(true);
    expect(flow.flags.count).toBe(3);
    expect(flow.yesMode).toBe(true);
    expect(flow.args).toEqual(['rest']);
  });

  it('accumulates repeated multi flags and stops at --', () => {
    const flow = createFlowContext(['--include', 'a', '--include', 'b', '--', '--not-a-flag'], flags);

    expect(flow.flags.include).toEqual(['a', 'b']);
    expect(flow.args).toEqual(['--not-a-flag']);
  });
});

describe('positional args', () => {
  it('requireArg returns the value at index', () => {
    expect(requireArg(['one', 'two'], 1, 'name')).toBe('two');
  });

  it('optionalArg returns undefined when missing', () => {
    expect(optionalArg(['one'], 1)).toBeUndefined();
  });
});
