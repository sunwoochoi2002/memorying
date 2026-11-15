# 글 카테고리 구현 계획

> **에이전트 구현자용:** superpowers:subagent-driven-development로 작업을 하나씩 진행합니다. 구현자는 한 번에 한 명입니다.

**목표:** `type`(essay/note)을 목록 파일에 등록하는 카테고리로 바꾸고, 글 폴더를 `[drafts/]<category>/<YYYY-MM-DD>/<slug>/`로 정리하고, 글 목록에 네이버식 사이드바를 넣습니다.

**설계:** [`2026-11-15-writing-categories-design.md`](../specs/2026-11-15-writing-categories-design.md)

**기술:** Astro 7, TypeScript, Node ESM, yaml, zod, Vitest, Playwright

## 공통 규칙

- `main`에서 바로 작업합니다. 브랜치와 푸시는 만들지 않습니다. 푸시(배포)는 따로 승인을 받습니다.
- 테스트는 AGENTS.md의 위험도별 규칙을 따릅니다.
  - 1, 2번 작업은 테스트를 먼저 쓰고, 실패를 확인한 뒤 구현합니다(RED → GREEN 기록).
  - 3번 작업은 Artifact 시안을 승인받은 뒤에 시작합니다.
- 글의 `ko.md`, `en.md`, 표지, 첨부 파일은 바이트 단위로 그대로 둡니다. `meta.yaml`에서는 `type:` 줄만 `category:` 줄로 바꿉니다.
- 테스트는 형식만 확인하고, 글 내용이나 문서 문구는 고정하지 않습니다.
- 검증 기록은 `.superpowers/sdd/2026-11-15-writing-categories/`에 남깁니다.

## 작업 1: 카테고리 목록, schema, 메타 이전

**파일:**
- 새 파일: `src/content/categories.yaml`, `scripts/writing-categories.mjs`
- 수정:
  - `src/lib/content-schema.ts`, `src/content.config.ts`, `src/lib/writing.ts`, `src/lib/content-data.ts`
  - `tests/support/writing-content.ts`, `tests/support/writing-rules.ts`
  - 관련 단위 테스트
  - 실제 글 15편과 `tests/fixtures/writing/*/meta.yaml`
- 화면 컴포넌트(`WritingListItem`, `ContentMetadata`, `WritingFilters`, `WritingLayout`)는 이 작업에서 최소한만 고칩니다. 예를 들어 `item.type === 'essay'`는 카테고리의 `newsletter` 값으로, 표시 이름은 카테고리 이름으로 바꿉니다. 빌드가 통과하는 데 필요한 만큼만입니다.

**인터페이스:**
- `readWritingCategories(path)`는 `[{ slug, name: { ko, en }, newsletter }]`를 순서대로 돌려줍니다.
  - 다음 경우에는 오류를 냅니다: slug 형식 오류, 중복, 예약어(`drafts`, `category`), 빈 이름, `newsletter`가 boolean이 아님.
- `createWritingMetadataSchema(image, categorySlugs)`는 `category`가 목록에 없으면 거부합니다. "essay만 featured 가능" 규칙은 없앱니다.
- `WritingArticle`의 `type`은 `category: string`으로 바뀝니다. 화면에서 이름과 구독 여부가 필요하면 카테고리 목록에서 찾습니다.
- 글 slug `category`는 금지합니다. `isValidWritingSlug`는 그대로 두고, 예약어 검사를 따로 둡니다.

**순서:**
- [ ] 바꾸기 전 글 파일들의 SHA-256 해시를 기록합니다.
- [ ] 실패하는 테스트를 씁니다.
  - 목록 검사: 정상, 중복, 예약어, 빈 이름
  - schema: 미등록 카테고리, featured 규칙
  - writing-rules: 미등록 카테고리, 예약 slug에 대한 한국어 메시지
  - 기존 type 테스트는 category 기준으로 바꿉니다.
- [ ] RED를 기록합니다.
- [ ] 구현하고, 메타 17개(글 15, fixture 2)의 `type:` 줄을 바꿉니다.
- [ ] GREEN을 기록합니다. 해시를 비교하고, `git diff`로 meta 변경이 한 줄뿐인지 확인합니다.
- [ ] `npm run check`와 `npm test`를 돌립니다.

## 작업 2: 카테고리 → 날짜 → 글 폴더 구조

**파일:**
- `scripts/organize-writing.mjs`, `scripts/new-writing.mjs`, `scripts/writing-directories.mjs`, `package.json`(필요하면)
- `tests/unit/organize-writing.test.ts`, `tests/unit/new-writing.test.ts`, 경로를 가정한 기존 테스트

**동작:**
- organizer:
  - 목적지는 `[drafts/]<category>/<publishedAt>/<slug>`입니다.
  - 미등록 카테고리는 아무것도 옮기기 전에 거부합니다.
  - 빈 날짜 폴더, 카테고리 폴더, `drafts` 폴더만 지웁니다.
  - `--dry-run`은 옮길 목록만 보여 주고 아무것도 바꾸지 않습니다.
  - 모르는 옵션이 있으면 사용법을 보여 주고 종료 코드 1로 끝냅니다.
- new-writing:
  - `-- <slug> --original <ko|en> --category <slug>` 형식입니다. 옵션 순서는 자유이고, 카테고리는 필수입니다.
  - 미등록 카테고리는 거부합니다.
  - 만드는 위치는 `drafts/<category>/<오늘>/<slug>/`입니다.

**순서:**
- [ ] 실패하는 테스트를 씁니다: 경로 계산, 카테고리 변경 재정리, 초안↔공개, 빈 폴더 정리, 미등록 거부, dry-run 무변경, 모르는 옵션 거부, new-writing의 카테고리 경로와 거부. RED를 기록합니다.
- [ ] 구현하고 GREEN을 기록합니다.
- [ ] `npm run organize:writing -- --dry-run`으로 옮길 목록을 확인한 뒤 실제로 실행합니다. 해시를 비교하고(글 15편, 파일 51개), 다시 실행해서 아무것도 옮기지 않는지 확인합니다.
- [ ] `npm run check`와 `npm test`를 돌립니다.

## 작업 3: 사이드바 화면 (Artifact 시안 승인 후)

**파일:**
- 새 파일: `src/pages/writing/category/[category].astro`, 사이드바 컴포넌트
- 수정: `src/pages/writing/index.astro`, `src/layouts/BaseLayout.astro`(넓은 폭 옵션), `src/components/WritingListItem.astro`, `src/components/ContentMetadata.astro`, `src/layouts/WritingLayout.astro`, `src/styles/global.css`
- 삭제: `src/components/WritingFilters.astro`
- 테스트: `tests/e2e/*.spec.ts`

**순서:**
- [ ] 승인된 시안대로 구현합니다.
  - `/writing/`에는 예전 `?type=` 주소를 카테고리 페이지로 넘기는 처리를 넣습니다.
  - 빈 상태 문구는 선우님께 받은 문구를 씁니다.
- [ ] dev 서버에서 데스크톱과 모바일 스크린샷을 찍어 시안과 같은지 확인받습니다.
- [ ] E2E 테스트를 씁니다. 모두 있는 글 기준입니다.
  - 사이드바 개수가 실제 공개 글 수와 같은지
  - 카테고리 페이지에 그 카테고리 글만 있는지
  - `aria-current` 표시
  - `?type=` 주소 넘김
  - 구독 블록이 newsletter 카테고리 글에만 있는지
  - 모바일 접힘
  - 접근성
- [ ] fixture에 newsletter 카테고리 글 하나와 아닌 카테고리 글 하나가 있는지 확인합니다.

## 작업 4: 문서와 문구 테스트 정리

- `docs/MAINTENANCE.md`:
  - "Essay와 Note 바꾸기" 절을 카테고리 바꾸기·추가하기로 고칩니다.
  - 새 명령 사용법을 적고, 폴더 예시를 고칩니다.
- `docs/PROJECT_STRUCTURE.md`, `README.md`, `docs/MARKDOWN_GUIDE.md`, `docs/CURRENT_WORK.md`를 고칩니다.
- `tests/unit/maintenance-guide.test.ts`와 `tests/unit/codespaces-continuity.test.ts`에서 문장과 제목을 고정하는 검사를 없앱니다. 남길 것은 다음과 같습니다.
  - 문서의 `npm run` 명령이 `package.json`에 있는지
  - 문서 안 상대 링크가 실제 파일을 가리키는지
  - README가 MAINTENANCE.md로 링크하는지
  - 비밀 값이 없는지
  - devcontainer 설정

## 마무리

- [ ] `env -u CLAUDECODE npm run verify`
- [ ] 독립 리뷰를 받고, 고친 뒤 verify를 다시 돌립니다.
- [ ] 빌드 결과를 확인합니다.
  - 공개 글 12편의 주소가 그대로입니다.
  - 카테고리 페이지가 사이트맵에 있습니다.
  - 초안은 없습니다.
  - 표지 6개가 그대로 나옵니다.
- [ ] `main`에 커밋합니다. 푸시는 승인 후에 합니다.
