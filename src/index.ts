// Root convenience barrel — re-exports the most fundamental shared types.
// For module-specific APIs, use subpath imports:
//   import { createFlowContext } from '@finografic/cli-kit/flow'
//   import { renderHelp } from '@finografic/cli-kit/render-help'
//   import { confirmFileWrite } from '@finografic/cli-kit/file-diff'
//   import { multiselectLineBreak } from '@finografic/cli-kit/tui'
//   import { promptSelect } from '@finografic/cli-kit/prompts'
export type { CommandHandler, RunCommandParams, SubcommandHandler } from './commands/index.js';
