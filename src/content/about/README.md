# 공개 프로필 편집 안내

글 아카이브는 `src/content/writing/`에서 관리합니다. 프로필의 소개와 이력은 아래 YAML 파일을 고칩니다. 두 언어의 내용을 빠짐없이 작성한 뒤 `npm run verify`를 실행해 주세요.

| 화면 | 편집 파일 | 내용 |
| --- | --- | --- |
| About | `src/content/about/profile.yaml` | 한국어·영어 소개 문단과 날짜가 있는 네 개의 Selected Affiliations 요약 |
| Projects | `src/content/projects/*.yaml` | Sunwoo’s Archive, JARVIS의 이름·기간·수상·양언어 설명 |
| Experience | `src/content/experience/*.yaml` | Education, Work & Lab Research, Activities & Leadership, Awards의 상세 이력 |

`name`, `title`, `heading`은 두 언어 모드에서 영어로 표시합니다. 설명은 `description.ko`와 `description.en`에 각각 작성합니다. 설명을 화면에서 여러 줄로 나누고 싶으면 `|-`를 쓰고 한 줄씩 적습니다. 따옴표 안에서 줄만 바꾸면 화면에서는 한 줄로 이어집니다.

```yaml
    description:
      ko: |-
        지도교수: Minwoo Chae.
        연구 주제: Bayesian Statistics for Data Analysis.
```

Experience 항목의 `originalLanguage`에는 설명을 처음 쓴 언어(`ko` 또는 `en`)를 적습니다. 모든 항목에 반드시 있어야 합니다. `order`는 프로젝트와 Experience 섹션의 화면 순서입니다. 각 섹션의 `entries`는 파일에 적힌 순서대로 표시하며, 모든 섹션을 **끝난 시점이 최근인 것부터** 적습니다. 진행 중(`Present`)인 항목이 맨 위에 오고, 끝난 시점이 같으면 늦게 시작한 항목을 먼저 적습니다. 순서가 어긋나면 `npm run verify`가 올바른 순서를 보여 주며 실패합니다. `period`는 `2025.06`, `2025.06–2025.12`, `2025.06–Present`, `Fall 2024, Spring 2025` 형식 중 하나로 씁니다(계절은 Spring, Summer, Fall, Winter). `period`에는 공개된 날짜를 유지하세요. 정확한 월을 알 수 없다면 임의로 만들지 말고 `Fall 2024, Spring 2025`처럼 확인된 표현을 사용합니다.

같은 항목의 상세 설명은 한곳에만 둡니다. About은 요약입니다. Experience 섹션은 이렇게 나눕니다.

- **Education**: 학교와 교육 프로그램. TU Delft의 수업도 여기에 둡니다.
- **Work & Lab Research**: 회사에서 일했거나 연구실에 소속되어 연구한 것.
- **Activities & Leadership**: 그 밖의 활동, 학교 프로그램(UGRP 등), 대회 참여, 행사. GSSC도 여기에 둡니다.
- **Awards**: 프로젝트로 받은 상을 포함한 모든 수상.

프로젝트로 받은 상은 두 곳에 나옵니다. Projects에서는 그 프로젝트의 `award`에 상 이름을 적어 제목 아래 회색 글씨로 보여 주고, Awards에는 짧은 설명과 함께 그 프로젝트로 가는 링크를 답니다. 자세한 이야기는 Projects에만 씁니다. 프로젝트로 따로 두지 않는 수상(예: BERA)은 Awards에 자세한 설명을 직접 씁니다. 링크는 이렇게 적습니다. 주소의 `#` 뒤는 `src/content/projects/`의 파일 이름(확장자 제외)입니다.

```yaml
    link:
      href: /projects/#jarvis
      label:
        ko: JARVIS 프로젝트 보기
        en: View the JARVIS project
```

`award`가 있는 프로젝트가 Awards에 링크와 함께 없으면 `npm run verify`가 실패합니다. 외부 사이트로 가는 링크는 `https://`로 시작하는 전체 주소를 씁니다. 기존 `/work/` 링크는 Projects로 연결됩니다.

공개용 이력을 고칠 때는 [`docs/resume.md`](../../../docs/resume.md)의 영문 원문을 먼저 확인하고, 한국어는 의미와 고유명사를 보존해 자연스럽게 번역하세요. 원문에 없는 성과나 재직 상태를 만들지 마세요. `npm run verify`는 문구가 아니라 두 언어가 모두 있는지, 날짜 형식이 맞는지 같은 형식만 확인하므로 문구를 바꿔도 검사를 고칠 필요가 없습니다. 원본 자료의 GPA, 성적, 연락처, 사진, 비공개 자료는 이 공개 YAML 파일에 넣지 마세요.
