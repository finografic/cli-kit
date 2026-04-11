/**
 * TUI layout constants — adjust here to tune column widths and padding across table output and multiselect
 * prompts.
 */
export const TUI_DEFAULTS = {
  name: {
    /** Minimum name-column width (chars) when the live data is narrower. */
    min: 28,
    /** Extra padding added to the longest name in the table. */
    extraPad: 6,
  },
  version: {
    /** Minimum version-column width (chars) when the live data is narrower. */
    min: 8,
    /** Extra padding added to the longest version string. */
    extraPad: 1,
  },
  multiselect: {
    /**
     * Extra padding added to the longest name among the selectable rows. Sized independently from the table
     * so the column fits the visible subset.
     */
    nameExtraPad: 2,
  },
} as const;
