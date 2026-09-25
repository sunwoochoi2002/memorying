import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { createAboutSchema, createExperienceSchema, createProjectSchema } from '../../src/lib/content-schema';

const readYaml = (path: string) => parse(readFileSync(resolve(path), 'utf8'));
const records = (directory: string) => readdirSync(directory).filter((name) => name.endsWith('.yaml')).map((name) => readYaml(`${directory}/${name}`));
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
const resume = normalize(readFileSync(resolve('docs/resume.md'), 'utf8').replace(/\*\*/g, ''));

describe('public profile content', () => {
  it('keeps About as a four-affiliation summary with its original intro', () => {
    const profile = createAboutSchema().parse(readYaml('src/content/about/profile.yaml'));
    const original = readYaml('tests/fixtures/profile-baseline.yaml');
    expect(profile.intro).toEqual(original.intro);
    expect(profile.affiliations.map((item) => item.title)).toEqual([
      'Military Service @ Republic of Korea Army (ROKA)',
      'Data Analytics Intern @ Chartmetric',
      'Exchange Student @ TU Delft',
      'Mathematics @ POSTECH',
    ]);
    expect(profile.affiliations.map((item) => item.period)).toEqual([
      '2026.02–Present', '2025.06–2025.12', '2024.02–2024.07', '2021.02–Present',
    ]);
  });

  it('gives three projects complete bilingual descriptions and source-faithful English', () => {
    const projects = records('src/content/projects').map((item) => createProjectSchema().parse(item));
    expect(projects.map((item) => item.name).sort()).toEqual(['BERA', 'JARVIS', 'Sunwoo’s Archive']);
    const jarvis = projects.find((item) => item.name === 'JARVIS')!;
    const bera = projects.find((item) => item.name === 'BERA')!;
    const archive = projects.find((item) => item.name === 'Sunwoo’s Archive')!;
    expect(normalize(jarvis.description.en)).toContain('Led a three-person team to build JARVIS, a desktop AI assistant prototype that indexes local files and uses RAG and specialized agents to answer questions, analyze data, generate reports, and provide personalized recommendations.');
    expect(normalize(bera.description.en)).toContain('Our team developed BERA, an AI research platform that predicts clinical trial outcomes and turns biotech company data into investment-risk reports. The award supported my visit to San Francisco during JPM Healthcare Week, where I explored the global biotech investment ecosystem.');
    expect(resume).toContain(normalize(jarvis.description.en));
    expect(resume).toContain(normalize(bera.description.en));
    expect(archive.description.en).toBe('A person-first personal writing and archival space.');
    expect(projects.every((item) => item.description.ko.trim())).toBe(true);
  });

  it('moves detailed history to four sections without losing source exceptions', () => {
    const sections = records('src/content/experience').map((item) => createExperienceSchema().parse(item));
    expect(sections.map((item) => item.id).sort()).toEqual(['activities', 'awards', 'education', 'work-research']);
    const all = sections.flatMap((section) => section.entries);
    const military = all.find((item) => item.title.startsWith('Military Service'))!;
    const ces = all.find((item) => item.title === 'CES 2026')!;
    const original = readYaml('tests/fixtures/profile-baseline.yaml');
    expect(military.description).toEqual(original.military);
    expect(ces.description).toEqual(original.ces2026);
    expect(all.find((item) => item.title.includes('GSSC'))?.description.en).toContain('Participated in a global entrepreneurship program focused on Human-Centered AI. Built entrepreneurial competencies and exchanged insights with international students at Korea\'s premier leadership conference.');
    for (const title of ['Data Analytics Intern @ Chartmetric', 'Korean Business Networking Conference (KBNC) 2025']) {
      expect(resume).toContain(normalize(all.find((item) => item.title === title)!.description.en));
    }
    expect(all.find((item) => item.title.includes('TU Delft'))?.period).toBe('2024.02–2024.07');
    expect(all.map((item) => item.title).join(' ')).not.toContain('JARVIS');
    expect(all.map((item) => item.title).join(' ')).not.toContain('BERA');
    expect(all.every((item) => item.description.ko.trim() && item.description.en.trim())).toBe(true);
  });
});
