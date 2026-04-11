import process from 'node:process';
import { styleText } from 'node:util';
import { MultiSelectPrompt, isCancel, settings, wrapTextWithPrefix } from '@clack/core';
import {
  S_BAR,
  S_BAR_END,
  S_CHECKBOX_ACTIVE,
  S_CHECKBOX_INACTIVE,
  S_CHECKBOX_SELECTED,
  limitOptions,
  symbol,
  symbolBar,
} from '@clack/prompts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MultiselectOption<T> {
  value: T;
  label?: string;
  hint?: string;
  disabled?: boolean;
  initialValue?: boolean;
}

export interface MultiselectOpts<T> {
  message: string;
  options: MultiselectOption<T>[];
  initialValues?: T[];
  required?: boolean;
  maxItems?: number;
}

// ─── Per-option renderer ─────────────────────────────────────────────────────

function renderOption<T>(opt: MultiselectOption<T>, state: string): string {
  const label = opt.label ?? String(opt.value);
  switch (state) {
    case 'disabled':
      return `${styleText('gray', S_CHECKBOX_INACTIVE)} ${styleText(['strikethrough', 'gray'], label)}${opt.hint ? ` ${styleText('dim', `(${opt.hint})`)}` : ''}`;
    case 'active':
      return `${styleText('cyan', S_CHECKBOX_ACTIVE)} ${label}${opt.hint ? ` ${styleText('dim', `(${opt.hint})`)}` : ''}`;
    case 'selected':
      return `${styleText('green', S_CHECKBOX_SELECTED)} ${styleText('dim', label)}${opt.hint ? ` ${styleText('dim', `(${opt.hint})`)}` : ''}`;
    case 'cancelled':
      return styleText(['strikethrough', 'dim'], label);
    case 'active-selected':
      return `${styleText('green', S_CHECKBOX_SELECTED)} ${label}${opt.hint ? ` ${styleText('dim', `(${opt.hint})`)}` : ''}`;
    case 'submitted':
      return styleText('dim', label);
    default:
      return `${styleText('dim', S_CHECKBOX_INACTIVE)} ${styleText('dim', label)}`;
  }
}

// ─── Custom multiselect ───────────────────────────────────────────────────────

/**
 * Like `@clack/prompts` multiselect, but the submit state displays selected items one per line instead of
 * comma-separated.
 */
export async function multiselectLineBreak<T>(opts: MultiselectOpts<T>): Promise<T[] | symbol> {
  const required = opts.required ?? true;

  return new MultiSelectPrompt({
    options: opts.options as { value: unknown; disabled?: boolean }[],
    initialValues: opts.initialValues as unknown[] | undefined,
    required,
    validate(value) {
      if (required && (value === undefined || value.length === 0)) {
        return `Please select at least one option.\n${styleText('reset', styleText('dim', `Press ${styleText(['gray', 'bgWhite', 'inverse'], ' space ')} to select, ${styleText(['gray', 'bgWhite', 'inverse'], ' enter ')} to submit`))}`;
      }
    },
    render() {
      const withGuide = settings.withGuide;
      const msgLine = wrapTextWithPrefix(
        process.stdout,
        opts.message,
        withGuide ? `${symbolBar(this.state)}  ` : '',
        `${symbol(this.state)}  `,
      );
      const header = `${withGuide ? `${styleText('gray', S_BAR)}\n` : ''}${msgLine}\n`;
      const selected = this.value ?? [];

      const renderOpt = (opt: { value: unknown; disabled?: boolean }, isActive: boolean): string => {
        const o = opt as MultiselectOption<T>;
        if (o.disabled) return renderOption(o, 'disabled');
        const isSelected = selected.includes(o.value);
        if (isActive && isSelected) return renderOption(o, 'active-selected');
        if (isSelected) return renderOption(o, 'selected');
        return renderOption(o, isActive ? 'active' : 'inactive');
      };

      switch (this.state) {
        case 'submit': {
          const prefix = withGuide ? `${styleText('gray', S_BAR)}  ` : '';
          const selectedLabels = this.options
            .filter(({ value }) => selected.includes(value))
            .map((o) => renderOption(o as MultiselectOption<T>, 'submitted'));
          const body =
            selectedLabels.length > 0 ? selectedLabels.join(`\n${prefix}`) : styleText('dim', 'none');
          return `${header}${prefix}${body}`;
        }

        case 'cancel': {
          const cancelledLabels = this.options
            .filter(({ value }) => selected.includes(value))
            .map((o) => renderOption(o as MultiselectOption<T>, 'cancelled'))
            .join(styleText('dim', ', '));
          if (cancelledLabels.trim() === '') return `${header}${styleText('gray', S_BAR)}`;
          const prefix = withGuide ? `${styleText('gray', S_BAR)}  ` : '';
          return `${header}${prefix}${cancelledLabels}${withGuide ? `\n${styleText('gray', S_BAR)}` : ''}`;
        }

        case 'error': {
          const barPrefix = withGuide ? `${styleText('yellow', S_BAR)}  ` : '';
          const errorLines = this.error
            .split('\n')
            .map((line, i) =>
              i === 0
                ? `${withGuide ? `${styleText('yellow', S_BAR_END)}  ` : ''}${styleText('yellow', line)}`
                : `   ${line}`,
            )
            .join('\n');
          const headerLineCount = header.split('\n').length;
          const errorLineCount = errorLines.split('\n').length + 1;
          const options = limitOptions({
            output: process.stdout,
            options: this.options,
            cursor: this.cursor,
            maxItems: opts.maxItems,
            columnPadding: barPrefix.length,
            rowPadding: headerLineCount + errorLineCount,
            style: renderOpt,
          });
          return `${header}${barPrefix}${options.join(`\n${barPrefix}`)}\n${errorLines}\n`;
        }

        default: {
          const barPrefix = withGuide ? `${styleText('cyan', S_BAR)}  ` : '';
          const headerLineCount = header.split('\n').length;
          const footerLineCount = withGuide ? 2 : 1;
          const options = limitOptions({
            output: process.stdout,
            options: this.options,
            cursor: this.cursor,
            maxItems: opts.maxItems,
            columnPadding: barPrefix.length,
            rowPadding: headerLineCount + footerLineCount,
            style: renderOpt,
          });
          return `${header}${barPrefix}${options.join(`\n${barPrefix}`)}\n${withGuide ? styleText('cyan', S_BAR_END) : ''}\n`;
        }
      }
    },
  }).prompt() as Promise<T[] | symbol>;
}

export { isCancel };
