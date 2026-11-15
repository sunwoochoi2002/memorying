# 블로그 운영 가이드

사이트를 고치고 싶을 때 이 문서를 먼저 펼쳐 보세요. 일상적인 작업을 순서대로 적어 두었습니다.

- 사이트 주소: https://sunwoochoi.com
- 저장소: https://github.com/sunwoochoi2002/memorying
- 폴더가 무엇인지 궁금하면 [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)를 보세요.
- 굵게·기울임·문단·링크 등 글쓰기 문법은 [`MARKDOWN_GUIDE.md`](MARKDOWN_GUIDE.md)를 보세요. “문법 확인해 줘”라고 요청하면 [검토 스킬](../skills/review-grammar/SKILL.md)에 따라 원문 수정 없이 제안만 받으며, 실제 수정은 직접 반영합니다.
- 지금까지 무엇을 했는지 궁금하면 [`docs/CURRENT_WORK.md`](CURRENT_WORK.md)를 보세요.

## 1. 두 가지 방법

**방법 A. Claude에게 부탁하기 (추천)**

말로 요청하면 됩니다. 수정과 검사는 Claude가 진행하고, 검사를 통과하면 배포할지 한 번만 묻습니다. 요청에 "배포까지 해 줘"를 붙이면 묻지 않고 바로 배포합니다. 요청은 이렇게 하면 됩니다.

- "새 글을 추가하고 싶어. 제목은 ○○이고 한국어 원문이야. 내용은 아래와 같아."
- "『홀로-』를 에세이 카테고리로 옮겨 줘."
- "『Teammates』 3번째 문단의 오타를 고쳐 줘."
- "홈 소개 문구를 ○○로 바꿔 줘."

**방법 B. 직접 고치기**

파일을 직접 열어 고칠 수도 있습니다. 이 문서의 각 작업에 순서가 적혀 있습니다. 다만 홈이나 About 같은 글이 아닌 화면의 문구는 아래 「자동 검사가 확인하는 것」을 먼저 읽어 주세요.

## 2. 한눈에 보기

| 하고 싶은 일 | 고치는 곳 | 자세히 |
| --- | --- | --- |
| 새 글 쓰기 | `src/content/writing/drafts/<카테고리>/YYYY-MM-DD/<슬러그>/` 폴더 | 3-1 |
| 글의 오타·문장 고치기 | 그 글의 `ko.md`, `en.md` | 3-2 |
| 글의 카테고리 바꾸기, 카테고리 추가·이름 변경·순서 변경 | 그 글의 `meta.yaml`, `src/content/categories.yaml` | 3-3 |
| 글 잠시 숨기기, 지우기 | 그 글의 `meta.yaml`, 폴더 | 3-4 |
| 글에 사진 넣기·바꾸기·빼기 | 그 글 폴더의 `cover.*` 파일 | 3-5 |
| 글 날짜 바꾸기 | 그 글의 `meta.yaml` | 3-6 |
| About, Projects, Experience, 홈 소개, 하단 링크, 구독 문구 | `src/content/about/`, `src/content/projects/`, `src/content/experience/`, `src/components/` | 3-7 |
| 뉴스레터 보내기 | `npm run newsletter`와 Buttondown 사이트 | 3-8 |

## 3. 자주 하는 작업

### 3-1. 새 글 추가

1. 터미널에서 글 폴더를 만듭니다. 슬러그는 공개 주소의 일부입니다. 소문자 영문, 숫자, 하이픈만 쓸 수 있고 **한 번 공개하면 바꾸지 않는 것이 원칙**입니다.

```bash
npm run new:writing -- remembering-summer --original ko --category essay
```

원문이 영어면 `--original en`으로 씁니다. `--category`에는 `src/content/categories.yaml`에 등록된 카테고리의 영문 이름(지금은 `essay` 또는 `note`)을 씁니다. 카테고리는 꼭 적어야 합니다. `YYYY-MM-DD`는 명령을 실행한 날짜입니다. 그러면 `src/content/writing/drafts/essay/YYYY-MM-DD/remembering-summer/` 아래에 파일 3개가 만들어집니다.

- `meta.yaml`: 글의 정보
- `ko.md`: 한국어 제목, 본문
- `en.md`: 영어 제목, 본문

`meta.yaml`에는 아래 항목이 들어 있습니다.

| 항목 | 뜻 | 값 |
| --- | --- | --- |
| `publishedAt` | 공개 날짜 | `2025-11-21` 형식 |
| `category` | 글의 카테고리. Writing 화면에서 이 카테고리를 누르면 이 글이 나옵니다. | `categories.yaml`에 등록된 영문 이름 (예: `essay`, `note`) |
| `originalLanguage` | 원문 언어. 목록에서 이 언어의 제목이 먼저 보입니다. | `ko` 또는 `en` |
| `draft` | 공개 여부 | `true`면 숨김, `false`면 공개 |
| `updatedAt` | 수정 날짜 (선택) | `2026-10-01` 형식 |
| `featured` | 대표 글 표시. 지금은 화면에 쓰이지 않으니 그대로 두세요. | `false` |

2. `ko.md`와 `en.md`의 맨 위 `title`을 채우고 본문을 씁니다. **두 언어를 모두 채워야** 합니다. 글에는 제목과 본문만 있고, 설명(`description`)은 없습니다. 파일에 `description`을 적으면 검사가 실패합니다. 번역이 필요하면 Claude에게 "영어 번역해 줘"라고 요청하세요.
3. 카테고리를 잘못 골랐다면 `meta.yaml`의 `category`를 고칩니다(3-3 참고).
4. 날짜를 확인합니다. 명령을 실행한 날짜가 `publishedAt`에 들어가 있습니다. 미래 날짜는 공개할 수 없습니다.
5. 미리보기로 확인합니다. 새 글은 `draft: true` 상태라 미리보기에서는 보이지만 공개 사이트에는 나오지 않습니다.

```bash
npm run dev -- --host 0.0.0.0
```

6. 공개할 준비가 되면 `meta.yaml`의 `draft: true`를 `draft: false`로 바꿉니다. `[Draft]`가 붙은 제목이 남아 있으면 빌드가 실패합니다.
7. `npm run organize:writing`을 실행합니다. `category`와 `publishedAt`에 맞춰 공개 글은 `src/content/writing/<카테고리>/YYYY-MM-DD/<슬러그>/`로, 초안은 `src/content/writing/drafts/<카테고리>/YYYY-MM-DD/<슬러그>/`로 글 폴더 전체가 이동합니다. 두 언어와 사진, 첨부 파일은 함께 유지되며 글 주소는 그대로입니다.
8. 4번 「배포하는 순서」로 올립니다.

### 3-2. 글 내용 고치기

1. `src/content/writing/<카테고리>/YYYY-MM-DD/<슬러그>/ko.md` 또는 `en.md`를 (초안은 `writing/drafts/<카테고리>/YYYY-MM-DD/<슬러그>/`) 열어 고칩니다. 원문과 번역이 어긋나지 않게, 뜻이 바뀌는 수정은 두 파일 모두에서 합니다.
2. 크게 고쳤다면 `meta.yaml`에 수정한 날짜를 추가할 수 있습니다. 글 위쪽에 「Updated 날짜」가 표시됩니다.

```yaml
updatedAt: 2026-10-01
```

3. 4번 「배포하는 순서」로 올립니다. 주소는 바뀌지 않습니다.

### 3-3. 카테고리 바꾸기와 추가하기

카테고리는 글을 묶는 칸입니다. Writing 화면 왼쪽(휴대폰에서는 제목 아래 가로 줄)에 「전체보기」와 함께 카테고리 이름과 글 수가 나옵니다. 카테고리 목록은 `src/content/categories.yaml` 한 파일에 있습니다.

```yaml
- slug: essay          # 폴더 이름과 주소에 쓰는 영문 이름
  name: { ko: 에세이, en: Essay }
  newsletter: true     # 글 끝에 구독 블록을 보여 줄지
- slug: note
  name: { ko: 노트, en: Note }
  newsletter: false
```

**글의 카테고리 바꾸기**

1. 그 글의 `meta.yaml`에서 `category` 한 줄만 바꿉니다.

```yaml
category: essay   # 에세이
category: note    # 노트
```

2. 옮겨질 위치를 먼저 확인합니다. 이 명령은 목록만 보여 주고 아무것도 옮기지 않습니다.

```bash
npm run organize:writing -- --dry-run
```

3. 목록이 맞으면 `npm run organize:writing`을 실행합니다. 글 폴더가 `<새 카테고리>/YYYY-MM-DD/<슬러그>/`로 통째로 옮겨지고, 비게 된 이전 날짜·카테고리 폴더는 지워집니다.

바뀌는 것은 다음과 같습니다.

- 목록의 카테고리 표시, 글 위쪽의 카테고리 링크, Writing 왼쪽 목록의 글 수가 바뀝니다.
- 구독 안내 상자는 `newsletter: true`인 카테고리(지금은 에세이)의 글 끝에만 나옵니다.
- 어느 카테고리의 글이든 같은 명령으로 메일을 만들 수 있습니다. 보낼지는 직접 정합니다.
- 글 주소 `/writing/<슬러그>/`는 바뀌지 않습니다.

**카테고리 추가하기**

`categories.yaml`에 세 줄을 더합니다. `slug`는 소문자 영문, 숫자, 하이픈만 쓰고, 다른 카테고리와 겹치면 안 됩니다. `drafts`와 `category`는 사이트가 쓰는 이름이라 쓸 수 없습니다. `name`에는 한국어와 영어 이름을 모두 씁니다.

```yaml
- slug: travel
  name: { ko: 여행, en: Travel }
  newsletter: false
```

새 카테고리는 `/writing/category/travel/` 주소로 열립니다. 글이 하나도 없으면 「이 카테고리에는 아직 공개된 글이 없습니다.」가 보입니다. 이 카테고리로 새 글을 쓰려면 `--category travel`로 만듭니다.

**이름 바꾸기, 순서 바꾸기, 지우기**

- **화면에 보이는 이름만 바꾸기**: `name`의 `ko`, `en`만 고칩니다. 폴더와 주소는 그대로입니다.
- **순서 바꾸기**: 파일 안에서 항목의 순서를 바꿉니다. 적힌 순서가 곧 왼쪽 목록의 순서입니다.
- **영문 이름(`slug`) 바꾸기**: `categories.yaml`의 `slug`와, 그 카테고리 글들의 `meta.yaml` `category`를 모두 같은 새 이름으로 바꾼 뒤 위의 2~3번(`--dry-run` 확인 후 정리)을 합니다. 카테고리 주소 `/writing/category/<slug>/`가 바뀌니, 이미 공유한 카테고리 주소는 끊깁니다. 글 주소는 그대로입니다. 비어 있는 옛 카테고리 폴더가 남으면 지워도 됩니다(Git은 빈 폴더를 기록하지 않습니다).
- **지우기**: 먼저 그 카테고리의 글을 모두 다른 카테고리로 옮긴 다음 `categories.yaml`에서 항목을 지웁니다. 목록에 없는 카테고리를 쓰는 글이 남아 있으면 정리 명령과 검사가 모두 멈추고 어느 글인지 알려 줍니다.

`featured: true`는 지금 화면에 쓰이지 않으니 건드리지 않아도 됩니다. 여러 공개 글에 `true`를 주면 빌드가 실패합니다.

### 3-4. 글 숨기기와 삭제

**잠시 숨기기 (추천)**: `meta.yaml`에서 `draft: false`를 `draft: true`로 바꿉니다. 목록, 홈, 사이트맵에서 빠지고 글 주소도 열리지 않습니다. 나중에 `false`로 돌리면 그대로 돌아옵니다. 바꾼 뒤 `npm run organize:writing`을 실행해 초안(`drafts/`)·공개 폴더 위치도 맞춥니다. 명령 실행 전에도 공개 여부는 `draft` 값으로 결정됩니다.

**완전히 지우기**: 글 폴더 전체를 지웁니다. 되돌리려면 Git 기록에서 복원해야 하므로, 정말 필요할 때만 하세요.

이미 공유했거나 뉴스레터로 보낸 글이라면 숨기거나 지운 뒤 그 주소로 들어오는 사람에게 「페이지를 찾을 수 없음」 화면이 나옵니다.

### 3-5. 사진 넣기, 바꾸기, 빼기

- **넣기**: 글 폴더에 사진 파일을 `cover.png`, `cover.jpg`, `cover.jpeg`, `cover.webp` 같은 이름으로 넣습니다. 글마다 **한 장만** 넣을 수 있습니다.
- **바꾸기**: 같은 이름으로 덮어씁니다. 확장자가 다르면(예: `cover.png`를 `cover.jpg`로) 이전 파일을 꼭 지우세요. 두 장이 있으면 빌드가 실패합니다.
- **빼기**: `cover.*` 파일을 지웁니다.
- 사진은 글 위쪽, 제목 바로 아래에 나옵니다. 크기와 모양이 제각각이어도 됩니다. 항상 같은 크기의 정사각형 흰색 틀에 **자르지 않고** 들어가고, 남는 자리는 흰색입니다. 사진을 미리 줄일 필요는 없습니다. 배포할 때 가벼운 파일로 자동 변환됩니다.
- 사진 설명(대체 텍스트)은 넣지 않아도 됩니다. 시각장애가 있는 독자에게 사진을 설명하고 싶을 때만 `cover.alt.ko.txt`, `cover.alt.en.txt`에 짧게 씁니다.
- 글 본문 중간에 사진을 넣는 것은 Claude에게 요청하세요.
- **공개 전에** 사진에 다른 사람의 얼굴, 회사 내부 정보, 저작권이 있는 내용이 있는지 확인하세요.

### 3-6. 글 날짜 바꾸기

`meta.yaml`의 `publishedAt`을 `2025-11-21`처럼 `연-월-일`로 씁니다. 목록은 이 날짜의 최신순으로 정렬됩니다. 공개된 글에는 미래 날짜를 쓸 수 없습니다. 날짜를 고친 뒤 아래 명령으로 폴더 날짜도 맞춥니다.

```bash
npm run organize:writing
```

이 명령은 모든 글의 날짜, 카테고리, 슬러그 중복, 목적지 충돌을 먼저 검사합니다. 문제가 있으면 이동을 시작하지 않습니다. 비어 있는 이전 날짜·카테고리 폴더만 지우고, 관계없는 파일은 남깁니다. 여러 번 실행해도 안전합니다. 무엇이 옮겨질지 미리 보고 싶으면 `npm run organize:writing -- --dry-run`을 실행합니다. 목록만 보여 주고 아무것도 옮기지 않습니다. 그 밖의 옵션을 붙이면 사용법만 보여 주고 멈춥니다. 날짜·카테고리·공개 여부는 폴더 이름보다 `meta.yaml` 값이 우선이며, 정리 전에도 목록 정렬과 공개 여부에 적용됩니다. 폴더를 옮겨도 마지막 `<슬러그>`와 `/writing/<슬러그>/` 주소는 바뀌지 않습니다.

### 3-7. 글이 아닌 페이지의 문구 고치기

| 바꾸고 싶은 것 | 파일 |
| --- | --- |
| 홈의 큰 제목과 한 줄 소개 | `src/components/PersonalIntroduction.astro` |
| About 소개와 소속 요약 | `src/content/about/profile.yaml`. [프로필 편집 안내](../src/content/about/README.md)를 참고합니다. |
| Privacy 문장 | `src/pages/privacy.astro` |
| Projects 항목 | `src/content/projects/` 안의 `.yaml` 파일. `order` 숫자로 순서를 정하고 `description.ko`·`.en`을 함께 고칩니다. 수상이 있으면 `award`에 적고, Awards에도 링크와 함께 추가합니다([프로필 편집 안내](../src/content/about/README.md) 참고). |
| Experience 항목 | `src/content/experience/`의 해당 섹션 `.yaml` 파일. 항목은 파일 순서대로 표시되며, 끝난 시점이 최근인 것부터(진행 중인 항목이 맨 위) 적습니다. 항목마다 설명의 원문 언어를 `originalLanguage: ko` 또는 `en`으로 적습니다. |
| 위쪽 메뉴 | `src/components/SiteHeader.astro` |
| 아래쪽 이름, GitHub, 이메일 링크 | `src/components/SiteFooter.astro` |
| 구독 안내 문구 | `src/components/NewsletterSignup.astro` |
| 색, 글꼴, 글자 크기, 간격 | `src/styles/global.css` |

프로필 YAML의 문구는 직접 고쳐도 되며, 한국어와 영문을 함께 맞춥니다. 이력 설명의 영문은 `docs/resume.md`를 참고합니다. 검사는 문구가 아니라 형식만 확인하므로, 문구를 바꿔도 검사를 고칠 필요가 없습니다(6번 참고). 성적, 연락처, 사진, 원본 자료는 공개 YAML에 넣지 마세요. 변경 뒤에는 `npm run verify`로 검사합니다.

### 3-8. 뉴스레터 보내기

글을 공개해도 이메일은 **자동으로 나가지 않습니다.** 메일은 매번 같은 양식으로 만들고, 발송은 직접 누릅니다.

**메일 양식** (인사말, 소개, 사진 없이 글만):

```text
제목: 글 제목 (원문 언어)

본문: 글 본문 그대로

---

웹에서 읽기 · Read on the web
https://sunwoochoi.com/writing/<슬러그>/

Sunwoo Choi
```

구독 취소 링크는 Buttondown이 자동으로 붙입니다. 메일은 **원문 언어 한 가지**로 만들고, 다른 언어는 사이트 링크에서 바꿔 읽습니다.

1. 글이 공개되어 있는지 확인합니다(`draft: false`).
2. 터미널에서 메일을 만듭니다. 슬러그는 카테고리, 날짜, `drafts`를 뺀 마지막 글 폴더 이름입니다. 명령이 글 폴더를 찾아 읽으므로 호출 방식은 그대로입니다.

```bash
npm run newsletter -- remembering-summer
```

   다른 언어로 보내고 싶을 때만 `--lang en` 또는 `--lang ko`를 붙입니다. 명령은 `Subject:`(제목)를 화면에 보여 주고, 본문을 `.newsletter/remembering-summer.ko.md`에 저장합니다. 이 폴더는 Git에 올라가지 않습니다.
3. Buttondown(https://buttondown.com/sunwoochoi) 대시보드에서 새 이메일을 만들고, 제목 칸에 `Subject:` 내용을, 본문에 저장된 파일 내용을 그대로 붙여 넣습니다. 양식은 손대지 마세요.
4. 본인에게 테스트 메일을 보내 휴대폰과 컴퓨터에서 확인합니다.
5. 확인한 뒤 직접 발송을 누릅니다.

명령은 초안 글이나 없는 글에는 메일을 만들지 않고 이유를 알려 줍니다. 구독자 이메일 주소와 Buttondown 비밀번호는 저장소나 채팅에 절대 붙여 넣지 마세요. 환영 메일(구독 직후 한 번 가는 인사)은 Buttondown 설정에서 따로 정하는 것이라 이 양식과 별개입니다.

## 4. 배포하는 순서

개인 사이트이므로 작업용 브랜치나 Pull Request(PR) 없이 `main` 브랜치에서 바로 고치고 올립니다. `main`에 올리면(push) 1~2분 뒤 사이트에 **자동으로 배포**됩니다. 그래서 올리기 전에 검사 하나만 반드시 통과시킵니다.

1. 작업 전에 최신 내용을 받습니다: `git switch main` 후 `git pull`
2. 파일을 고칩니다.
3. (선택) 미리보기로 확인합니다: `npm run dev -- --host 0.0.0.0` 후 Codespaces의 포트 4321을 엽니다. 이 포트는 private으로 유지하세요. 글을 새로 쓰거나 모양을 바꿨을 때 권장합니다.
4. **필수 검사**를 돌립니다. 2분 정도 걸립니다: `npm run verify`
   - 마지막에 오류 없이 끝나면 통과입니다. 실패하면 올리지 말고 오류 문구를 Claude에게 보여 주세요.
5. 커밋하고 올립니다: `git add <고친 파일>`, `git commit -m "고친 내용"`, `git push`
6. 1~2분 뒤 https://sunwoochoi.com 에서 확인합니다.

올린 뒤에도 GitHub가 같은 검사(`verify`)를 한 번 더 돌립니다. GitHub 저장소의 Actions 탭에서 빨간색이 보이면 Claude에게 알려 주세요.

디자인이나 구조를 크게 바꾸는 작업처럼 실제 사이트에 올리기 전에 인터넷 주소로 미리 보고 싶을 때만 예전처럼 작업용 브랜치와 PR을 쓸 수 있습니다. PR을 만들면 Cloudflare가 `https://<브랜치 이름>.memorying.pages.dev` 미리보기 주소를 만들어 줍니다. 평소에는 필요 없습니다.

배포 후 확인 목록입니다.

- [ ] 홈, Writing, 고친 글이 열리는가
- [ ] 한국어와 English 전환이 되는가
- [ ] 목록에 새 글이 최신순으로 나오는가
- [ ] 휴대폰 화면에서도 자연스러운가
- [ ] 사진이 있으면 틀 안에 온전히 보이는가

## 5. 되돌리기

배포한 뒤 문제가 보이면 서두르지 말고 되돌립니다.

- **방법 1**: Claude에게 "방금 배포를 되돌려 줘"라고 요청합니다. 문제가 된 커밋을 되돌리는 커밋(`git revert`)을 만들고, 검사를 통과하면 `main`에 올립니다. 가장 안전합니다.
- **방법 2**: Cloudflare 대시보드의 Workers & Pages → memorying → Deployments에서 이전 배포를 골라 되돌릴 수 있습니다. 급할 때만 쓰세요. 이때 GitHub의 `main`은 그대로이므로 나중에 방법 1로 정리해야 합니다.

## 6. 자동 검사가 확인하는 것

`verify` 검사는 사이트가 깨지지 않았는지 자동으로 확인합니다. 배포 전에 `npm run verify`로 직접 돌리고, 올린 뒤에는 GitHub도 한 번 더 돌립니다. 글에 대해서는 **저장소에 있는 글을 읽어서 기준에 맞는지만** 봅니다. 글 제목이나 개수를 미리 적어 두지 않았기 때문에, 새 글을 추가하거나 제목을 바꾸거나 카테고리를 바꾸거나 새 카테고리를 만들어도 **검사를 고칠 필요가 없습니다.** 기준에 맞으면 그대로 통과합니다.

기준은 이렇습니다. 어기면 어느 글의 무엇이 문제인지 알려 주며 실패합니다.

- 글 폴더 이름(슬러그)은 소문자 영문, 숫자, 하이픈만 씁니다.
- `ko.md`와 `en.md`가 모두 있고, 제목과 본문이 비어 있지 않습니다.
- 한국어 파일에는 한글이, 영어 파일에는 영문이 있습니다. 언어가 뒤바뀐 실수를 잡습니다.
- 공개된 글에는 `[Draft]` 표시, 생성된 기본 문구, 미래 날짜가 없습니다. 숨긴 글(`draft: true`)은 이 기준을 적용하지 않습니다.
- `category`는 `src/content/categories.yaml`에 등록된 카테고리, `originalLanguage`는 `ko` 또는 `en`입니다. 글 폴더 이름(슬러그)으로 `category`는 쓸 수 없습니다.
- 공개된 대표 글(`featured: true`)은 하나뿐입니다.
- 사진은 글마다 `cover.<확장자>` 한 장뿐입니다. 이름이 다른 사진(예: `IMG_1234.png`)이 글 폴더에 있으면 「화면에 쓰이지 않는다」며 알려 줍니다. 이름만 `cover.`로 바꾸면 됩니다.
- 화면 동작은 글마다 확인합니다. 목록 순서와 제목, 날짜, 카테고리 표시, 카테고리 목록과 글 수, 카테고리 페이지, 한국어와 English 전환, 사진 틀, 구독 상자(`newsletter: true`인 카테고리에만), 화면 크기별 모양이 그 글의 실제 내용과 맞는지 봅니다.
- 배포용 빌드에서는 숨긴 글이 목록, 홈, 사이트맵, 주소에 하나도 나오지 않는지 봅니다.

이 기준은 `tests/support/writing-rules.ts`에 있고, 기준 자체를 바꾸고 싶으면 Claude에게 요청하세요.

**프로필(About, Projects, Experience)**: 문구는 확인하지 않고 형식만 봅니다. 소개와 설명에 한국어와 영문이 모두 있는지, About 소속이 4개이고 기간이 `2026.02–Present` 같은 형식인지, 프로젝트 이름과 `order`가 겹치지 않는지, Experience의 네 섹션이 모두 있는지, 각 섹션이 끝난 시점이 최근인 것부터 적혀 있는지, 수상이 있는 프로젝트가 Awards에 그 프로젝트로 가는 링크와 함께 있는지, 한국어와 English 전환이 되는지입니다. 이 기준은 `src/lib/content-schema.ts`와 `tests/unit/profile-pages.test.ts`에 있습니다.

**아직 문구를 그대로 확인하는 곳**: 홈의 제목과 소개, 구독 상자 문구처럼 글이 아닌 화면의 문구는 검사가 그대로 확인합니다. 이 문구를 바꾸면 검사도 함께 고쳐야 하니 Claude에게 요청하세요(3-7 참고).

## 7. 문제가 생겼을 때

| 증상 | 확인할 것 |
| --- | --- |
| 새 글이 사이트에 안 보임 | `draft: false`인가, 날짜가 미래가 아닌가, `main`에 push했는가, push 후 1~2분이 지났는가 |
| 빌드나 검사가 실패함 | 실패 화면의 오류 문구를 Claude에게 붙여 주세요. 대개 한쪽 언어 파일 누락, `[Draft]` 표시 남음, 사진 두 장, 날짜 오류입니다. |
| 사진이 안 나옴 | 파일 이름이 정확히 `cover.<확장자>`인가, 글 폴더 안에 있는가 |
| 구독 버튼이 안 눌림 | Cloudflare 설정 값이 지워졌을 수 있습니다. 아래 8번을 확인하세요. |
| 옛 화면이 보임 | 브라우저를 새로고침하거나 시크릿 창으로 열어 보세요. |
| 글꼴이 이상하게 보임 | 새로고침 후에도 같으면 Claude에게 화면 캡처와 함께 알려 주세요. |

## 8. 바꾸기 전에 반드시 먼저 상의할 것

다음은 사이트 전체에 영향을 주므로 혼자 바꾸지 말고 Claude와 먼저 이야기하세요.

- **글 주소(슬러그)**: 바꾸면 이미 공유한 링크가 모두 끊깁니다.
- **`public/_headers`**: 보안 설정입니다. 잘못 바꾸면 글꼴이나 구독 폼이 막힙니다.
- **Cloudflare 설정**: 프로젝트 `memorying`의 환경 변수 `SITE_URL`(`https://sunwoochoi.com`), `PUBLIC_BUTTONDOWN_USERNAME`(`sunwoochoi`), `NODE_VERSION`(`22`)은 지우거나 바꾸지 마세요. `sunwoochoi.com`의 DNS와 `www` 이동 규칙도 마찬가지입니다.
- **Buttondown 계정 설정**: 뉴스레터 이름과 사용자명.
- **비밀번호, API 키, 토큰**: 저장소, 문서, 채팅 어디에도 붙여 넣지 마세요. Claude에게 Cloudflare, 가비아, Buttondown 비밀번호를 알려 줄 필요도 없습니다.

## 9. 용어 풀이

| 용어 | 뜻 |
| --- | --- |
| 슬러그 | 글 주소의 마지막 부분. `/writing/alone/`의 `alone` |
| 카테고리 | 글을 묶는 칸. `src/content/categories.yaml`에 등록하고, 글의 `meta.yaml` `category`에 적음 |
| draft | 초안 표시. `draft: true`면 공개 사이트에 나오지 않음 |
| 커밋(commit) | 고친 내용을 하나의 기록으로 저장하는 것 |
| push | 저장한 기록을 GitHub에 올리는 것. `main`에 올리면 자동으로 배포됨 |
| 미리보기 | 올리기 전에 내 Codespace에서 사이트를 띄워 보는 것 (`npm run dev`) |
| PR(Pull Request) | 「이 수정을 반영해도 될까요?」 하는 요청서. 큰 변경을 미리 볼 때만 선택적으로 사용 |
| 배포 | 고친 내용이 실제 사이트에 올라가는 것 |
| `verify` | 사이트가 깨지지 않았는지 확인하는 자동 검사 |

## 10. 관련 문서

- [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md): 폴더 안내와 글, 사진 규칙
- [`docs/publishing.md`](publishing.md): 글쓰기와 배포 전 점검표
- [`docs/codespaces-guide.md`](codespaces-guide.md): 공유 컴퓨터에서 Codespaces로 작업하는 방법
- [`docs/CURRENT_WORK.md`](CURRENT_WORK.md): 진행 기록과 현재 상태
