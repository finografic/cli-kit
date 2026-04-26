import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { parse } from 'jsonc-parser';

export interface XdgPaths {
  /** Base config directory — `~/.config/{org}` or `~/.config` when org is null. */
  configDir(): string;
  /** `~/.config/{org}/{packageName}.config.json` */
  configPath(packageName: string): string;
  /** `~/.config/{org}/{packageName}.cache.json` */
  cachePath(packageName: string): string;
}

/**
 * Factory that binds an org namespace and returns path helpers.
 *
 * @example
 *   const xdg = createXdgPaths(); // ~/.config/finografic/
 *   const xdg = createXdgPaths('acme'); // ~/.config/acme/
 *   const xdg = createXdgPaths(null); // ~/.config/  (flat)
 *
 * @param org - Subdirectory under `~/.config/`. Defaults to `'finografic'`. Pass `null` for a flat layout:
 *   `~/.config/{packageName}.config.json`.
 */
export function createXdgPaths(org: string | null = 'finografic'): XdgPaths {
  function configDir(): string {
    const base = process.env['XDG_CONFIG_HOME'] ?? join(homedir(), '.config');
    return org ? join(base, org) : base;
  }
  return {
    configDir,
    configPath: (packageName: string) => join(configDir(), `${packageName}.config.json`),
    cachePath: (packageName: string) => join(configDir(), `${packageName}.cache.json`),
  };
}

// ─── Legacy ───────────────────────────────────────────────────────────────────

/** @deprecated Use `createXdgPaths()` instead. */
export function getConfigPath(appName: string): string {
  const base = process.env['XDG_CONFIG_HOME'] ?? join(homedir(), '.config');
  return join(base, appName);
}

/** @deprecated Use `createXdgPaths()` instead. */
export function getCachePath(appName: string): string {
  const base = process.env['XDG_CACHE_HOME'] ?? join(homedir(), '.cache');
  return join(base, appName);
}

export async function readJsonc<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return parse(raw) as T;
  } catch (err) {
    if ((err as { code?: string }).code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeJsonc(filePath: string, data: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
