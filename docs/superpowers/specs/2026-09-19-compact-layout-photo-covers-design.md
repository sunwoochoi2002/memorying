# Compact Layout and Photo Covers Design

## Goal

Make every page compact and comfortable on any screen by centering the whole site in one narrow reading column, shrink the type scale to match, and give article photos one consistent look regardless of their original size. Approved reference: the Claude design canvas "Memorying 사진 표시 방식 비교" (desktop and mobile boards plus the frame sheet), modeled on the column structure of yoonchulyi.com.

## Decisions

- **Centered column:** header, page content, and footer share one column of `39rem` (624px) centered in the viewport, with `1.5rem` side gutters on small screens. Text stays left-aligned inside the column.
- **Type scale (desktop, then below 45rem):** home heading 48px, 38px; page and article titles 38px, 32px; list titles 22px, 20px; Korean prose 17px, 16px; English prose 21px, 20px; dates and metadata 18px, 17px; navigation 19px, 17px. Instrument Serif is a display face, so its small text is set a little larger than a text serif would be.
- **Photo frame:** every cover sits in a square (1:1) white frame with a hairline border, directly under the article header. The photo is shown whole with `object-fit: contain`, never cropped, and the leftover space stays white. Frame size is therefore identical on every article at a given viewport.
- **Alt text:** the user chose empty alt text. A `cover.<ext>` file now shows the cover even when `cover.alt.ko.txt` and `cover.alt.en.txt` are absent; missing files mean `alt=""` (decorative), a present file is used for its language. The earlier rule that a cover needs both alt files is retired. Covers declared in `meta.yaml` still require both alt values.
- **Files:** the four photos the user added are renamed to `cover.png` or `cover.jpeg` in their essay folders. Originals stay in the repository; Astro produces optimized WebP at build time.

## Unchanged

Colors, fonts, copy, routes, dates, the language toggle, the subscribe block, and the person-first bilingual invariants.

## Known trade-offs

- Wide screenshots shrink inside the square frame, so small text in them is hard to read, especially on phones. A tap-to-enlarge viewer could be added later.
- Portrait photos leave large white side areas in a square frame.
- Empty alt text means screen-reader users get no description of the photos.

## Verification

Tests are updated first: centered column geometry at three widths, the new type scale, the same-size square frame for all four real covers at desktop and phone widths, and the optional alt rule. Then `env -u CLAUDECODE npm run verify`, screenshots, the GitHub `Verify` run, and the Cloudflare preview before the user decides on merge.
