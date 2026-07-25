# Publishing Memorying

Memorying의 글은 이 저장소가 유일한 원본입니다. 처음 한 번의 Notion 이전 이후에는 새 글을 Notion에서 시작하지 않고, 이 저장소에서 바로 작성합니다.

## 새 글 만들기

새 글마다 아래 명령을 실행합니다. `slug`는 공개 URL의 일부가 되므로 소문자 영문·숫자와 단일 하이픈만 사용합니다.

```bash
npm run new:writing -- <slug> --original <ko|en>
```

예를 들어 한국어 원문 글을 시작하려면 다음과 같이 실행합니다.

```bash
npm run new:writing -- remembering-summer --original ko
```

명령은 다음 구조를 만듭니다.

```text
src/content/writing/remembering-summer/
├── meta.yaml
├── ko.mdx
└── en.mdx
```

이미 존재하는 슬러그는 덮어쓰지 않습니다. 생성된 글은 `draft: true`이므로 로컬에서는 확인할 수 있지만 공개 빌드에는 포함되지 않습니다.

## 어떤 파일에 무엇을 쓰나

`meta.yaml`에는 두 언어가 공유하는 정보만 둡니다.

```yaml
publishedAt: 2026-07-25
type: essay
originalLanguage: ko
draft: true
featured: false
```

`publishedAt`, `type`, `originalLanguage`, `draft`, 선택적인 `updatedAt`, `featured`, 표지 이미지 정보는 모두 `meta.yaml`의 책임입니다. `type`은 `essay` 또는 `note`이며, 대표 글(`featured`)은 공개된 Essay 하나에만 사용할 수 있습니다.

`ko.mdx`와 `en.mdx`에는 각 언어의 제목, 설명, 본문을 따로 작성합니다. 원문 언어와 번역문을 모두 채워야 합니다. 사이트는 `originalLanguage`에 기록된 원문을 먼저 보여 주고, 독자는 같은 URL에서 한국어와 English 사이를 전환합니다.

```mdx
---
title: 한국어 제목
description: 한국어 설명
---

한국어 본문을 작성합니다.
```

초안 표시는 두 파일에서 모두 완성한 뒤에만 지우고, `meta.yaml`의 `draft: false`로 바꿉니다. 공개 글에는 `[Draft]` 제목이나 설명을 남길 수 없습니다.

## 표지 이미지와 대체 텍스트

표지 이미지는 선택 사항이며 글 폴더 안에 함께 보관합니다. JPEG, PNG, WebP를 모두 사용할 수 있습니다. 예를 들면 `cover.jpg`, `cover.png`, `cover.webp`가 가능합니다. WebP는 파일 크기 측면에서 권장할 뿐, JPEG나 PNG를 변환해야 하는 것은 아닙니다.

표지를 쓰면 `meta.yaml`에 로컬 경로와 한국어·영어 대체 텍스트를 함께 작성합니다.

```yaml
coverImage: ./cover.jpg
coverImageAlt:
  ko: 노을이 비치는 바닷가
  en: A beach at sunset
```

대체 텍스트도 현재 표시 언어에 맞추어 바뀌므로 한 언어만 작성할 수 없습니다. 표지를 쓰지 않는 글에는 `coverImage`와 `coverImageAlt`를 모두 생략합니다.

## Notion 글을 처음 한 번 옮기기

Notion은 과거 글을 옮길 때만 사용합니다. API 연결, 자동 가져오기, 동기화는 하지 않습니다.

1. Notion 글의 원문 언어를 정하고 새 글 폴더를 만듭니다.
2. 원문을 해당하는 `ko.mdx` 또는 `en.mdx`에 복사해 Markdown/MDX 문법을 정리합니다.
3. 다른 언어 파일에 번역을 작성하고 제목·설명·본문을 모두 검토합니다.
4. Notion에 삽입된 이미지는 직접 내려받아 같은 글 폴더에 저장합니다. 외부 Notion 이미지 URL 대신 `./image-name.jpg`처럼 로컬 상대 경로를 사용합니다.
5. 이미지가 표지라면 위의 `coverImageAlt` 두 언어 값을 채웁니다.
6. 로컬에서 미리 본 뒤 저장소에 커밋합니다.

이전이 끝난 뒤에는 이 저장소의 글 폴더와 Git 이력이 글의 원본입니다.

## 미리 보기와 공개

작성 중에는 개발 서버를 실행합니다.

```bash
npm run dev
```

공개하기 전에는 전체 검증을 실행합니다.

```bash
npm run verify
```

두 언어 파일, 날짜, 링크, 이미지, 대체 텍스트를 검토한 뒤 `draft: false`로 바꾸고 커밋합니다. 공개 슬러그는 영구적입니다. URL을 바꿔야 할 때는 기존 주소를 보존하는 명시적 리디렉션을 별도로 준비합니다.

## Essay 뉴스레터 발송

사이트에 글을 공개해도 이메일은 자동 발송되지 않습니다. Essay는 Buttondown에서 수동으로 발송합니다.

1. 공개된 Essay의 정식 URL을 확인합니다.
2. Buttondown 대시보드에서 Markdown 이메일을 만들고, 이메일에서 안전하지 않은 MDX 구성 요소는 일반 텍스트·이미지·링크로 바꿉니다.
3. 사이트 글의 정식 URL을 넣고 데스크톱과 모바일에서 테스트 메일을 확인합니다.
4. 검토 후 Buttondown에서 직접 발송을 승인합니다.

Note는 기본적으로 뉴스레터 발송 대상이 아닙니다.

## 별도인 Cloudflare와 도메인 작업

Cloudflare Pages 배포, DNS 변경, 도메인 연결, 최종 `SITE_URL` 설정은 이 작성 흐름과 별도의 후속 작업입니다. 아직 이 저장소의 새 글 명령은 그 어떤 Cloudflare 프로젝트나 도메인도 만들거나 변경하지 않습니다.

배포를 시작할 때는 아래 항목을 별도로 확인합니다.

- [ ] GitHub 저장소를 Cloudflare Pages에 연결한다.
- [ ] 빌드 명령을 `npm run build`, 출력 디렉터리를 `dist`로 설정한다.
- [ ] 최종 HTTPS 도메인을 정한 뒤 `SITE_URL`을 설정한다.
- [ ] 실제 Buttondown 사용자명으로 `PUBLIC_BUTTONDOWN_USERNAME`을 설정한다.
- [ ] 미리 보기와 실제 배포에서 sitemap, canonical URL, `_headers`, 구독 폼을 확인한다.

## 출시 전 확인

- [ ] 최소 한 개의 Essay와 한 개의 Note를 두 언어 버전으로 검토했다.
- [ ] Home, About, Writing, Work, Privacy, 개별 글, 404를 확인했다.
- [ ] 320, 390, 768, 1024, 1440px 레이아웃을 확인했다.
- [ ] `npm run verify`를 통과했다.
- [ ] 실제 테스트 이메일로 구독과 Buttondown 확인 흐름을 점검했다.
- [ ] Essay 뉴스레터의 정식 URL과 수신·구독 해지 흐름을 점검했다.
