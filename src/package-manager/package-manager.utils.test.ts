import { describe, expect, it } from 'vitest';

import { sortedRecord } from './package-manager.utils.js';

describe('sortedRecord', () => {
  it('returns keys in alphabetical order', () => {
    expect(Object.keys(sortedRecord({ zebra: '1', alpha: '2', mid: '3' }))).toEqual([
      'alpha',
      'mid',
      'zebra',
    ]);
  });

  it('does not mutate the input object or its key order', () => {
    const input = { b: '1', a: '2' };
    const snapshot = { ...input };
    sortedRecord(input);
    expect(input).toEqual(snapshot);
    expect(Object.keys(input)).toEqual(['b', 'a']);
  });
});
