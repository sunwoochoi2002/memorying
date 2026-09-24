# Edit the About page

All public About copy is in [`profile.yaml`](profile.yaml). Edit that file, then run
`npm run verify` before committing and deploying. The About page reads it through
Astro's content collection, so no TypeScript edit is needed for ordinary copy or
timeline changes.

- `intro.ko` and `intro.en` are the paragraphs above the timelines. Keep both
  languages complete.
- `labels` controls the page title and disclosure labels.
- `sections` controls the section order. `heading` and every entry `title` are
  displayed in English in both language modes.
- `entries[].description.ko` and `.en` are the corresponding expandable text.
  The `featured: true` section shows its descriptions without a click.
- `period` starts with `YYYY.MM` and may end with `–YYYY.MM` or `–Present`.
  Entries within each section are shown newest first based on the start month.
- An entry can include `link.href` and bilingual `link.label`.

Keep grades, portrait, contact details, and source documents in
[`docs/resume.md`](../../../docs/resume.md), not in this public file. The public
copy here is based on that resume, but you can update it independently when
the resume changes.
