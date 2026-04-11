import * as clack from '@clack/prompts';

// ─── Shared option type ───────────────────────────────────────────────────────

export interface SelectOption<T> {
  value: T;
  label: string;
  hint?: string;
}

// ─── Opts interfaces (subset of flow opts — frictionless upgrade path) ────────

export interface PromptSelectOpts<T> {
  message: string;
  options: SelectOption<T>[];
  default?: T;
}

export interface PromptMultiSelectOpts<T> {
  message: string;
  options: SelectOption<T>[];
  initialValues?: T[];
  /** When true, at least one option must be selected */
  minOne?: boolean;
}

export interface PromptTextOpts {
  message: string;
  default?: string | (() => string);
  placeholder?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
  /** 'exit' (default): process.exit(0) on cancel. 'skip': return default or empty string. */
  cancelBehavior?: 'exit' | 'skip';
}

export interface PromptConfirmOpts {
  message: string;
  default?: boolean;
  /** 'exit' (default): process.exit(0) on cancel. 'skip': return default value. */
  cancelBehavior?: 'exit' | 'skip';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a typed options array from a data array. Useful any time a command builds clack multiselect or select
 * options from a typed domain array.
 */
export function createSelectOptions<T>(
  items: T[],
  toOption: (item: T) => SelectOption<T>,
): SelectOption<T>[] {
  return items.map(toOption);
}

// ─── Prompt functions ─────────────────────────────────────────────────────────

export async function promptSelect<T>(opts: PromptSelectOpts<T>): Promise<T> {
  const result = await clack.select({
    message: opts.message,
    options: opts.options as clack.Option<T>[],
  });
  if (clack.isCancel(result)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result as T;
}

export async function promptMultiSelect<T>(opts: PromptMultiSelectOpts<T>): Promise<T[]> {
  const result = await clack.multiselect({
    message: opts.message,
    options: opts.options as clack.Option<T>[],
    initialValues: opts.initialValues,
    required: opts.minOne ?? false,
  });
  if (clack.isCancel(result)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result as T[];
}

export async function promptText(opts: PromptTextOpts): Promise<string> {
  const result = await clack.text({
    message: opts.message,
    defaultValue: typeof opts.default === 'function' ? opts.default() : opts.default,
    placeholder: opts.placeholder,
    validate: opts.validate,
  });
  if (clack.isCancel(result)) {
    if (opts.cancelBehavior === 'skip') {
      const fallback = typeof opts.default === 'function' ? opts.default() : opts.default;
      return fallback ?? '';
    }
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result as string;
}

export async function promptConfirm(opts: PromptConfirmOpts): Promise<boolean> {
  const result = await clack.confirm({ message: opts.message });
  if (clack.isCancel(result)) {
    if (opts.cancelBehavior === 'skip') {
      return opts.default ?? false;
    }
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result as boolean;
}
