import { describe, expect, it } from 'vitest';

import { createSelectOptions } from './prompts.utils.js';

describe('createSelectOptions', () => {
  it('maps items through toOption', () => {
    expect(createSelectOptions(['a', 'b'], (item) => ({ value: item, label: item.toUpperCase() }))).toEqual([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
  });
});
