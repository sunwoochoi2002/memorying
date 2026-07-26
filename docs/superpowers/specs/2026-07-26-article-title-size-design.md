# Article Title Size Design

## Goal

Reduce both Korean and English writing-detail titles by approximately 20% while preserving the existing responsive scale and word-boundary wrapping behavior.

## Scope

- Change only the `h1` elements inside `.article-header`.
- Scale the current responsive font-size range from `clamp(2.6rem, 7vw, 5rem)` to `clamp(2.08rem, 5.6vw, 4rem)`.
- Apply the same size to the Korean and English title fragments so switching languages does not alter the visual hierarchy.
- Keep `word-break: keep-all`, `overflow-wrap: normal`, and `hyphens: none` unchanged.
- Do not change homepage, Writing archive, or Work page heading sizes.

## Verification

- Add a browser assertion that the visible Korean and English article titles resolve to the reduced responsive size.
- Confirm the title remains within the mobile viewport and continues to wrap at word boundaries.
- Run the complete project verification suite before integration.

## Integration

Commit the tested change on `feature/memorying-mvp`, merge that branch into `main`, and verify the merged result before considering the work complete.
