export interface RunCommandParams {
  argv: string[];
  cwd: string;
}

export type CommandHandler = (params: RunCommandParams) => Promise<void> | void;

export type SubcommandHandler = (argv: string[], cwd: string) => Promise<void> | void;
