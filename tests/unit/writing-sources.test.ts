import { describe, expect, it } from 'vitest';
import {
  WRITING_CONTENT_DIRECTORY,
  WRITING_FIXTURE_DIRECTORY,
  createWritingGlobPattern,
  resolveWritingSourceDirectories,
  stripWritingSourceDirectory,
} from '../../src/lib/writing-sources';

describe('writing source directories', () => {
  it('reads only the real archive by default', () => {
    expect(resolveWritingSourceDirectories({})).toEqual(['src/content/writing']);
    expect(resolveWritingSourceDirectories({ WRITING_FIXTURES: '' })).toEqual([WRITING_CONTENT_DIRECTORY]);
    expect(resolveWritingSourceDirectories({ WRITING_FIXTURES: 'true' })).toEqual([WRITING_CONTENT_DIRECTORY]);
  });

  it('adds the test fixtures only when WRITING_FIXTURES is exactly "1"', () => {
    expect(resolveWritingSourceDirectories({ WRITING_FIXTURES: '1' })).toEqual([
      'src/content/writing',
      'tests/fixtures/writing',
    ]);
    expect(WRITING_FIXTURE_DIRECTORY).toBe('tests/fixtures/writing');
  });

  it('builds a single-directory or brace glob pattern', () => {
    expect(createWritingGlobPattern(['src/content/writing'], '**/meta.(yaml|yml)')).toBe(
      'src/content/writing/**/meta.(yaml|yml)',
    );
    expect(createWritingGlobPattern(['src/content/writing', 'tests/fixtures/writing'], '**/*.(md|mdx)')).toBe(
      '{src/content/writing,tests/fixtures/writing}/**/*.(md|mdx)',
    );
  });

  it('strips the matching source directory so IDs stay unchanged', () => {
    const directories = ['src/content/writing', 'tests/fixtures/writing'];
    expect(stripWritingSourceDirectory('src/content/writing/alone/ko.mdx', directories)).toBe('alone/ko.mdx');
    expect(stripWritingSourceDirectory('tests/fixtures/writing/memorying-start/meta.yaml', directories)).toBe(
      'memorying-start/meta.yaml',
    );
    expect(() => stripWritingSourceDirectory('public/alone/ko.mdx', directories)).toThrow(
      'Writing entry "public/alone/ko.mdx" is outside the configured source directories.',
    );
  });
});
