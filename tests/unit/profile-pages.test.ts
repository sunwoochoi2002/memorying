import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { createAboutSchema, createExperienceSchema, createProjectSchema } from '../../src/lib/content-schema';

const readYaml = (path: string) => parse(readFileSync(resolve(path), 'utf8'));
const records = (directory: string) => readdirSync(directory).filter((name) => name.endsWith('.yaml')).map((name) => readYaml(`${directory}/${name}`));
const duplicates = (values: unknown[]) => values.filter((value, index) => values.indexOf(value) !== index);

// Months as sortable numbers (year * 12 + month). A season covers its semester months.
const seasons: Record<string, [number, number]> = { Spring: [3, 6], Summer: [7, 8], Fall: [9, 12], Winter: [12, 14] };
function periodRange(period: string): { start: number; end: number } {
  const points = period.split(/[–,]/).map((part) => part.trim()).flatMap((part) => {
    if (part === 'Present') return [[Infinity, Infinity]];
    const month = part.match(/^(\d{4})\.(\d{2})$/);
    if (month) return [[Number(month[1]) * 12 + Number(month[2]), Number(month[1]) * 12 + Number(month[2])]];
    const season = part.match(/^(Spring|Summer|Fall|Winter) (\d{4})$/);
    if (season) return [seasons[season[1]].map((value) => Number(season[2]) * 12 + value)];
    throw new Error(`Unrecognized period "${period}". Use 2025.06, 2025.06–2025.12, 2025.06–Present, or Fall 2024, Spring 2025.`);
  });
  return { start: points[0][0], end: points[points.length - 1][1] };
}

// These checks enforce structure only, so editing profile wording never requires a test change.
describe('public profile content', () => {
  it('keeps About as a bilingual intro with four dated affiliations', () => {
    const profile = createAboutSchema().parse(readYaml('src/content/about/profile.yaml'));
    expect(profile.intro.ko.length).toBeGreaterThan(0);
    expect(profile.intro.en.length).toBeGreaterThan(0);
    expect(profile.affiliations).toHaveLength(4);
  });

  it('gives every project a unique name, a unique order, and both translations', () => {
    const projects = records('src/content/projects').map((item) => createProjectSchema().parse(item));
    expect(projects.length).toBeGreaterThan(0);
    expect(duplicates(projects.map((item) => item.name))).toEqual([]);
    expect(duplicates(projects.map((item) => item.order))).toEqual([]);
  });

  it('keeps the four Experience sections, each with bilingual entries', () => {
    const sections = records('src/content/experience').map((item) => createExperienceSchema().parse(item));
    expect(sections.map((item) => item.id).sort()).toEqual(['activities', 'awards', 'education', 'work-research']);
    expect(duplicates(sections.map((item) => item.order))).toEqual([]);
  });

  it('lists every project award in Awards with a link to its project', () => {
    const projectIds = readdirSync('src/content/projects').filter((name) => name.endsWith('.yaml')).map((name) => name.replace(/\.yaml$/, ''));
    const awarded = projectIds.filter((id) => createProjectSchema().parse(readYaml(`src/content/projects/${id}.yaml`)).award);
    const awards = createExperienceSchema().parse(readYaml('src/content/experience/awards.yaml'));
    const links = awards.entries.map((entry) => entry.link?.href).filter((href) => href?.startsWith('/projects/#'));
    expect(awarded.length).toBeGreaterThan(0);
    expect(links.map((href) => href!.slice('/projects/#'.length)).sort()).toEqual(awarded.sort());
  });

  it('lists every Experience section by end date, newest first, then by later start', () => {
    const sections = records('src/content/experience').map((item) => createExperienceSchema().parse(item));
    for (const section of sections) {
      const sorted = [...section.entries].sort((a, b) => {
        const [left, right] = [periodRange(a.period), periodRange(b.period)];
        return right.end - left.end || right.start - left.start;
      });
      expect(section.entries.map((item) => item.title), section.id).toEqual(sorted.map((item) => item.title));
    }
  });
});
