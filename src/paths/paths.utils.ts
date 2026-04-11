import { homedir } from 'node:os';
import { resolve } from 'node:path';

export function tildeify(absPath: string): string {
  const home = homedir();
  return absPath.startsWith(home) ? `~${absPath.slice(home.length)}` : absPath;
}

export function resolveTargetDir(cwd: string, pathArg?: string): string {
  if (!pathArg) return cwd;
  return resolve(cwd, pathArg);
}
