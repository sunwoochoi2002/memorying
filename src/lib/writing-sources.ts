export const WRITING_CONTENT_DIRECTORY = 'src/content/writing';
export const WRITING_FIXTURE_DIRECTORY = 'tests/fixtures/writing';

/**
 * Directories the writing collections read from, relative to the repository root.
 * Test fixtures join the real archive only when `WRITING_FIXTURES` is exactly "1",
 * so ordinary dev servers and builds never see sample articles.
 */
export function resolveWritingSourceDirectories(
  env: Record<string, string | undefined>,
): string[] {
  return env.WRITING_FIXTURES === '1'
    ? [WRITING_CONTENT_DIRECTORY, WRITING_FIXTURE_DIRECTORY]
    : [WRITING_CONTENT_DIRECTORY];
}

export function createWritingGlobPattern(directories: readonly string[], filePattern: string): string {
  const prefix = directories.length === 1 ? directories[0] : `{${directories.join(',')}}`;
  return `${prefix}/${filePattern}`;
}

export function stripWritingSourceDirectory(entry: string, directories: readonly string[]): string {
  for (const directory of directories) {
    if (entry.startsWith(`${directory}/`)) return entry.slice(directory.length + 1);
  }
  throw new Error(`Writing entry "${entry}" is outside the configured source directories.`);
}
