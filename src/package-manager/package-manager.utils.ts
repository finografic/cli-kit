import { spawn } from 'node:child_process';
import process from 'node:process';

/**
 * Spawn a pnpm sub-process with inherited stdio so the user sees its output directly. Resolves to the exit
 * code (or `null` if the process was terminated by a signal).
 */
export function runPnpm(cwd: string, args: string[]): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('close', (code) => resolve(code));
  });
}

/**
 * Run `pnpm install` in the given directory. Convenience wrapper around {@link runPnpm}.
 */
export function runPnpmInstall(cwd: string): Promise<number | null> {
  return runPnpm(cwd, ['install']);
}
