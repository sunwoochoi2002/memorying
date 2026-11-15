# Date-based writing storage

Approved in conversation on 2026-11-13: group writing by `publishedAt`, with drafts in a sibling `drafts` directory, and provide a command to synchronize folders after metadata changes.

## Intent and structure

Make the archive easy for the author to browse and sort by date:

```text
src/content/writing/YYYY-MM-DD/<slug>/{meta.yaml,ko.md,en.md,cover.*}
src/content/writing/drafts/YYYY-MM-DD/<slug>/{meta.yaml,ko.md,en.md,cover.*}
```

Use the calendar date in `publishedAt`. The metadata remains authoritative for date and draft visibility. Keep the final article folder name as the stable slug, independent of its parent directories. Both translations and every image/attachment move together, with bytes unchanged.

## Approaches

The chosen date/slug hierarchy groups same-day articles. A date-slug folder is shallower but does not group same-day writing. Year/month nesting adds browsing steps without helping this archive. Keep test fixtures separate; readers may support their existing flat layout.

## Behavior and constraints

- New drafts go directly into `drafts/YYYY-MM-DD/<slug>/`.
- `npm run organize:writing` reads metadata and moves entire article folders to the correct date and draft group. Validate dates, duplicate global slugs, and destination conflicts before moving anything; never overwrite existing directories. Repeating the command is safe. Remove empty former date folders, preserving unrelated files.
- Runtime collection IDs, covers, content checks, and newsletter lookup support nested storage and preserve `/writing/<slug>/` URLs. Metadata continues to control publication even before the organizer is run.
- Preserve original-language ordering, complete translations, draft exclusion in production, and existing metadata schemas. No writing descriptions, UI changes, deployment, or delivery integration changes.
- Work directly on main. Preserve the two initially untracked article directories (`chain-of-thoughts`, `suffering-to-success`), including their untracked status; moving their contents is in scope, committing them is not.
- Update author documentation and the continuity checkpoint to reflect the new workflow.

## Verification

Observe focused failing tests before code changes. Test stable IDs, recursive discovery, draft creation, newsletter lookup, safe organizing, duplicate slugs, invalid dates and no-op reruns. Compare hashes of all real writing files before and after migration. Run focused tests and `npm run verify`, then independent review. Leave changes for inspection; deployment requires separate user approval.
