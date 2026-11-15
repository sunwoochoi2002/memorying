# 글 카테고리와 카테고리 → 날짜 → 글 폴더 구조

2026-11-15 대화에서 승인되었습니다. 결정 사항: 네이버식 사이드바, 초안은 `drafts/카테고리/날짜/글`, 카테고리는 목록 파일에 등록, 기존 글은 `essay`와 `note` 카테고리로 이전, 관리자 도구는 만들지 않고 GitHub 기반 정적 사이트를 유지.

## 배경

조사 결과와 결정 사항:
- **관리자 도구(1번)는 하지 않습니다.**
  - 붙이려면 Cloudflare Access, 서버 함수, GitHub 토큰, 보안 정책(CSP) 같은 운영 설정을 바꿔야 합니다.
  - 기성 CMS(Sveltia, Decap, Pages CMS)는 지금처럼 `meta.yaml`, `ko.md`, `en.md`를 한 폴더에 나눠 두는 구조를 다루지 못합니다.
  - 그래서 사이트는 GitHub 기반 정적 사이트로 유지합니다. 대신 GitHub에서 새 글을 쓰기 쉽게 만드는 작업을 이번 계획 다음에 별도로 진행합니다(맨 아래 "후속 작업" 참고).
- **결정 사항:**
  - 화면은 네이버식 사이드바로 합니다.
  - 초안은 `drafts/카테고리/날짜/글`에 둡니다.
  - 카테고리는 목록 파일 하나에 등록합니다.
  - 기존 글은 `essay`와 `note` 두 카테고리로 그대로 옮깁니다.
- **지켜야 할 것:**
  - 글 주소 `/writing/<slug>/`는 그대로 둡니다.
  - 원문 언어를 먼저 보여 주고, 두 번역을 모두 갖추고, 초안은 공개 사이트에서 빼는 규칙을 유지합니다.
  - 글 본문은 한 글자도 바꾸지 않습니다.

## 1. 카테고리 목록과 데이터 형식

**목록 파일 `src/content/categories.yaml`**(새 파일). 적힌 순서가 곧 사이드바 순서입니다.
```yaml
- slug: essay          # 폴더 이름과 주소에 쓰는 영문 이름
  name: { ko: 에세이, en: Essay }
  newsletter: true     # 글 끝에 구독 블록을 보여 줄지
- slug: note
  name: { ko: 노트, en: Note }
  newsletter: false
```
- 검사 규칙:
  - slug는 글 slug와 같은 형식입니다.
  - 중복된 slug는 안 됩니다.
  - `drafts`와 `category`는 예약어라 slug로 쓸 수 없습니다.
  - 한국어와 영어 이름은 둘 다 비어 있으면 안 됩니다.
- 이 파일을 읽고 검사하는 공통 모듈은 `scripts/writing-categories.mjs`입니다.
  - 스크립트(organizer, new-writing), Astro 설정, 테스트가 모두 이 모듈을 씁니다.
  - 기존 `scripts/writing-directories.mjs`의 `isValidWritingSlug`를 재사용합니다.

**글의 `meta.yaml`:** `type: essay|note`를 `category: <slug>`로 바꿉니다.
- `src/lib/content-schema.ts`의 `createWritingMetadataSchema`가 등록된 카테고리 목록을 받습니다. 등록되지 않은 카테고리는 빌드 오류가 납니다.
- "에세이만 featured 가능" 규칙은 없앱니다. "공개된 featured 글은 하나만" 규칙은 유지합니다.
- `src/lib/writing.ts`:
  - `WritingType`, `WritingTypeFilter`, `parseWritingFilters`, `buildWritingSearch`를 정리하고, `WritingArticle.category`를 씁니다.
  - `selectFeaturedArticle`에서 type 조건을 뺍니다.
- `src/lib/content-data.ts`는 메타를 그대로 넘기므로 형식만 맞춥니다.
- 글 slug로 `category`는 금지합니다(`/writing/category/` 주소와 겹치기 때문입니다). 검사는 `tests/support/writing-rules.ts`와 organizer, new-writing 세 곳에 넣습니다.

**기존 글 옮기기(이 단계에서 함께 해야 빌드가 통과합니다):**
- 실제 글 15편과 테스트 fixture 2개의 `meta.yaml`에서 `type:` 줄만 `category:`로 바꿉니다. essay는 essay로, note는 note로 갑니다.
- `ko.md`, `en.md`, 표지 파일은 바이트 단위로 그대로 둡니다. 옮기기 전에 SHA-256을 기록하고 끝난 뒤 비교합니다.

**테스트(먼저 작성):** schema 테스트(미등록 카테고리, 예약어), 목록 파일 검사, writing-rules의 한국어 오류 메시지. 기존 type 관련 테스트는 category 기준으로 바꿉니다. 테스트는 형식만 확인하고 글 내용은 고정하지 않습니다.

## 2. 폴더 구조: 카테고리 → 날짜 → 글

```
src/content/writing/<category>/<YYYY-MM-DD>/<slug>/
src/content/writing/drafts/<category>/<YYYY-MM-DD>/<slug>/
```
- `scripts/organize-writing.mjs`:
  - 목적지를 `[drafts/]<category>/<publishedAt>/<slug>`로 계산합니다.
  - 등록되지 않은 카테고리는 아무것도 옮기기 전에 거부합니다.
  - 비게 된 날짜 폴더, 카테고리 폴더, `drafts` 폴더만 지우고 다른 파일은 남깁니다.
  - 지난번에 미뤄 둔 것도 함께 고칩니다. 모르는 옵션(`--help` 등)은 거부하고, 옮길 목록만 보여 주는 `--dry-run`을 추가합니다.
- `scripts/new-writing.mjs`:
  - 사용법은 `npm run new:writing -- <slug> --original <ko|en> --category <slug>`입니다. 카테고리는 필수입니다.
  - 만드는 위치는 `drafts/<category>/<오늘>/<slug>/`입니다.
- 이미 재귀로 동작하는 부분은 바뀌지 않는지 테스트로만 확인합니다.
  - 로더 ID(`getWritingSourceId`, `getWritingMetaSourceId`)
  - 표지 수집(`src/lib/content.ts`)
  - 뉴스레터 검색
  - `tests/support/writing-content.ts`
- 실제 글은 organizer로 옮기고, 해시를 비교합니다(글 15편, 파일 51개). git이 이동으로 인식하는지도 봅니다.
- **테스트(먼저 작성):** 카테고리 경로 계산, 카테고리 변경 뒤 재정리, 초안과 공개 사이 이동, 빈 카테고리 폴더 정리, 미등록 카테고리 거부, `--dry-run`은 아무것도 옮기지 않음, 모르는 옵션 거부.

## 3. 화면: 네이버식 사이드바

- **주소:**
  - `/writing/`은 전체보기입니다.
  - `/writing/category/<slug>/`는 카테고리별 정적 페이지입니다(새 파일 `src/pages/writing/category/[category].astro`). JS 없이도 동작하고 링크로 공유할 수 있으며, 사이트맵에 들어갑니다.
- **사이드바:**
  - 카테고리 목록과 글 수를 보여 줍니다. 공개 글만 셉니다.
  - "전체보기"가 맨 위에 오고, 지금 보고 있는 항목은 `aria-current`로 표시합니다.
  - 글이 0개인 카테고리도 표시하고, 그 페이지에서는 빈 상태 문구를 보여 줍니다.
- **배치:**
  - 데스크톱에서는 왼쪽에 사이드바, 오른쪽에 글 목록을 둡니다.
  - 45rem 이하 화면에서는 카테고리 목록이 글 목록 위에 접혀서 나옵니다(`<details>`).
  - 사이드바는 글 목록 페이지(전체보기, 카테고리)에만 넣습니다. 글 상세 페이지와 홈은 지금의 한 단을 유지합니다.
- **넓이:** 글 목록 페이지에서는 `BaseLayout`에 넓은 폭 옵션을 줘서 헤더, 본문, 푸터를 함께 넓힙니다.
- **디자인 검토(Claude Artifact):** 화면 코드를 짜기 전에 사이드바 시안을 Artifact로 만들어 확인받습니다.
  - 지금 사이트의 색, 글꼴, 간격과 실제 글 제목, 카테고리를 그대로 씁니다.
  - 시안 2~3개를 한 페이지에서 비교할 수 있게 만듭니다. 사이드바 폭과 위치, 개수 표시 방식, 모바일에서 접는 방식이 비교 대상입니다.
  - 데스크톱과 모바일 폭을 바꿔 볼 수 있게 합니다.
  - 피드백을 받아 같은 Artifact를 고쳐 가며 확정합니다.
  - 확정한 시안대로 실제 CSS와 컴포넌트를 만든 뒤, dev 서버 스크린샷으로 시안과 같은지 한 번 더 확인받고 E2E 테스트를 붙입니다.
- **확정 시안 (2026-11-15, 시안 B "네이버형 상자"):** [Artifact](https://claude.ai/artifact/AvZ4dydsUVnmbWPnCf1BzR)
  - **데스크톱:**
    - 왼쪽 사이드바는 테두리 상자(약 13rem)입니다. 맨 위에 "카테고리" 제목과 구분선이 있고, 그 아래 "전체보기 (N)"를 굵게 둡니다. 카테고리는 들여 써서 "이름 (N)"으로 표시하고, 현재 항목은 파란색과 `aria-current`로 나타냅니다.
    - 오른쪽 위에는 `Writing` 제목과 "카테고리 이름 · N개의 글" 머리줄을 두고, 머리줄 아래에 진한 구분선을 긋습니다.
    - 목록은 줄마다 옅은 구분선이 있고, 제목 왼쪽, 날짜 오른쪽입니다. 카테고리 페이지에서는 줄에 카테고리 이름을 표시하지 않습니다.
  - **모바일:** 제목 아래에 카테고리를 테두리 있는 가로 칩으로 두고, 옆으로 밀어 넘깁니다. 이 경우 접는 `<details>`는 쓰지 않습니다. 목록 줄은 제목, 그 아래 날짜 순서입니다.
  - 넓이는 헤더, 본문, 푸터가 함께 약 56rem입니다.
  - 전체보기의 목록 줄에 카테고리 이름을 표시할지는 구현 스크린샷에서 확인합니다.
- **카테고리 이름 표시:**
  - 목록의 각 줄과 홈의 최근 글 줄에서 오른쪽의 "Essay/Note" 표시를 한국어 카테고리 이름으로 바꿉니다(`WritingListItem.astro`).
  - 글 상세 페이지의 메타 줄(`ContentMetadata.astro`)에는 카테고리 링크를 넣습니다. 이름은 언어 토글에 맞춰 바뀝니다.
- **구독 블록:** 지금은 essay 글에만 나옵니다(`WritingLayout.astro:52`). 앞으로는 카테고리의 `newsletter: true` 여부로 정합니다. 구독 문구는 바꾸지 않습니다.
- **정리:**
  - `WritingFilters.astro`와 `?type=` 필터 JS를 없애고 사이드바 링크로 대체합니다.
  - 예전 주소 `/writing/?type=essay|note`로 들어오면 해당 카테고리 페이지로 넘겨 주는 작은 스크립트를 둡니다.
- **글 목록 페이지의 빈 상태 문구:** 선우님이 정한 문구(2026-11-15)는 "이 카테고리에는 아직 공개된 글이 없습니다."입니다. 전체보기에 공개 글이 하나도 없을 때도 같은 문구를 씁니다.
- **E2E 테스트(`tests/e2e/*.spec.ts`):** 화면 승인 뒤에 작성합니다. type 필터 테스트를 다음 항목으로 바꾸고, 지금처럼 있는 글을 기준으로 확인합니다.
  - 사이드바 개수가 실제 공개 글 수와 같은지
  - 카테고리 페이지에 그 카테고리 글만 있는지
  - 예전 `?type=` 주소가 카테고리 페이지로 넘어가는지
  - 구독 블록이 newsletter 카테고리 글에만 있는지
  - 모바일 배치와 접근성
- fixture로 newsletter 카테고리 글 하나와 아닌 카테고리 글 하나가 항상 있도록 보장합니다.

## 4. 문서와 기록

- `docs/MAINTENANCE.md`:
  - "Essay와 Note 바꾸기" 절을 "카테고리 바꾸기·추가하기"로 바꿉니다.
  - 새 사용법(`--category`, `organize:writing --dry-run`)을 적습니다.
- `docs/PROJECT_STRUCTURE.md`, `README.md`, `docs/MARKDOWN_GUIDE.md`의 경로 예시를 고칩니다.
- `docs/CURRENT_WORK.md`에 이번 작업 기록을 남기고, 지난번 미뤄 둔 항목 중 해결된 것(organizer 옵션)을 반영합니다.
- **문서 문구 테스트를 줄입니다.**
  - 대상은 `tests/unit/maintenance-guide.test.ts`와 `tests/unit/codespaces-continuity.test.ts`입니다.
  - 특정 문장이나 제목을 확인하는 부분은 없앱니다.
  - 남기는 것:
    - 문서에 적힌 `npm run` 명령이 실제 `package.json`에 있는지
    - 문서 안의 링크가 실제 파일을 가리키는지
    - README가 MAINTENANCE.md로 링크하는지

## 후속 작업 (이번 범위 밖, 별도 계획)

**GitHub에서 새 글 쓰기를 쉽게 만들기.** 후보는 다음과 같습니다.
- GitHub Actions의 "새 글 만들기" 버튼: slug, 카테고리, 원문 언어를 입력하면 초안 폴더를 만들어 커밋합니다. 휴대폰 GitHub 앱에서도 쓸 수 있습니다.
- 커밋할 때 자동으로 `organize:writing`을 실행하는 방법
- 배포 전 내용 검사: 지금은 Cloudflare가 verify 결과와 상관없이 배포합니다. 이걸 막으려면 Cloudflare 빌드 명령을 바꿔야 하는데, 운영 설정이라 승인이 필요합니다.

**미리보기 중 폴더 이동 문제:** dev 서버 중에 글 폴더를 옮기면 미리보기에서 글이 사라질 수 있는 P3 2건도 그때 함께 다룹니다.
