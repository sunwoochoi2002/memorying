# 공개 프로필 편집 안내

글 아카이브는 `src/content/writing/`에서 관리합니다. 프로필의 소개와 이력은 아래 YAML 파일을 고칩니다. 두 언어의 내용을 빠짐없이 작성한 뒤 `npm run verify`를 실행해 주세요.

| 화면 | 편집 파일 | 내용 |
| --- | --- | --- |
| About | `src/content/about/profile.yaml` | 한국어·영어 소개 문단과 날짜가 있는 네 개의 Selected Affiliations 요약 |
| Projects | `src/content/projects/*.yaml` | Sunwoo’s Archive, JARVIS, BERA의 이름·기간·수상·양언어 설명 |
| Experience | `src/content/experience/*.yaml` | Education, Work & Research, Activities & Leadership, Awards의 상세 이력 |

`name`, `title`, `heading`은 두 언어 모드에서 영어로 표시합니다. 설명은 `description.ko`와 `description.en`에 각각 작성합니다. `order`는 프로젝트와 Experience 섹션의 화면 순서입니다. 각 섹션의 `entries`는 파일에 적힌 순서대로 표시합니다. `period`에는 공개된 날짜를 유지하세요. 정확한 월을 알 수 없다면 임의로 만들지 말고 `Fall 2024, Spring 2025`처럼 확인된 표현을 사용합니다.

같은 항목의 상세 설명은 한곳에만 둡니다. About은 요약이고, JARVIS·BERA의 상세 및 관련 수상은 Projects에 둡니다. TU Delft의 수업은 Education, GSSC는 Activities & Leadership에 둡니다. 기존 `/work/` 링크는 Projects로 연결됩니다.

공개용 이력을 고칠 때는 [`docs/resume.md`](../../../docs/resume.md)의 영문 원문을 먼저 확인하고, 한국어는 의미와 고유명사를 보존해 자연스럽게 번역하세요. 원문에 없는 성과나 재직 상태를 만들지 마세요. About 소개, 군 복무 설명, CES 2026 설명은 기존 공개 문구를 유지하는 예외입니다. 원본 자료의 GPA, 성적, 연락처, 사진, 비공개 자료는 이 공개 YAML 파일에 넣지 마세요.
