# 공유 컴퓨터에서 Codespaces로 작업 이어가기

이 안내는 `main`에서 공유 컴퓨터로 작업을 안전하게 이어가기 위한 것입니다. 자세한 Codex 명령은 [Codex CLI](https://developers.openai.com/codex/cli/)와 [Codex 인증](https://developers.openai.com/codex/auth/) 문서를, Codespaces 절차는 GitHub의 [Codespace 만들기](https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository), [수명 주기](https://docs.github.com/en/codespaces/about-codespaces/understanding-the-codespace-lifecycle), [소스 제어](https://docs.github.com/en/codespaces/developing-in-a-codespace/using-source-control-in-your-codespace), [보안](https://docs.github.com/en/codespaces/reference/security-in-github-codespaces) 문서를 참고하세요.

## 작업 시작 전

공유 컴퓨터에서는 private/incognito 창을 사용하세요. GitHub와 ChatGPT의 MFA를 확인하고, 브라우저가 비밀번호를 저장하도록 허용하지 마세요.

## Codespace 만들기

GitHub에서 이 저장소의 기본 `main` 브랜치로 Codespace를 만드세요. 컨테이너 생성 명령은 `npm ci`와 Chromium 설치를 자동 실행합니다. 완료 후 아래 명령으로 상태를 확인합니다.

```bash
git status --short
git switch main
git pull --ff-only origin main
npm ci
```

`git status --short` 출력이 비어 있지 않으면 여기서 멈추세요. 현재 브랜치의 기존 작업을 이해하고 해당 브랜치에서 안전하게 커밋하고 push한 후에만 `git switch main`과 `git pull --ff-only origin main`을 실행하세요.

수정 전에는 작업 목적을 나타내는 새 브랜치를 만드세요. 예를 들어 다음 글을 준비한다면:

```bash
git switch -c feature/next-writing-update
```

## Codex 시작

`codex`가 없다면 공식 설치 명령만 사용하세요.

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

그 다음 `codex login`으로 로그인합니다. 브라우저 콜백이 되지 않으면 `codex login --device-auth`를 사용하세요. API 키를 저장소 파일이나 셸 기록에 입력하거나 보관하지 마세요. `~/.codex/auth.json`을 커밋하거나 복사하지 마세요.

## 작업 재개

`AGENTS.md`와 `docs/CURRENT_WORK.md`를 읽고 Resume prompt를 새 Codex 세션에 붙여 넣으세요. 변경 전 focused test를 정하고 strict TDD로 진행합니다. 미리보기는 아래처럼 실행하고 포트 `4321`은 private으로 유지하세요.

```bash
npm run dev -- --host 0.0.0.0
```

## 작업 종료

focused test와 전체 검증을 실행합니다.

```bash
npm run verify
git status --short
```

변경 범위를 확인하고 커밋한 뒤 feature 브랜치를 push하세요. 원격 반영을 확인한 다음 `codex logout`을 실행하세요. Codespace를 중지하거나 삭제하기 전에는 항상 `codex logout`을 실행하세요. 이어서 ChatGPT와 GitHub에서 로그아웃하고 private 창을 닫습니다.

## Codespace 삭제

원하는 모든 작업이 `git push`로 푸시된 뒤에만 Codespace를 삭제하세요. 푸시하지 않은 작업이 있다면 먼저 `codex logout`을 실행하고 Codespace를 중지한 뒤 나중에 다시 이어서 작업하세요.

## 문제 복구

생성 로그를 확인하고, 제공되면 recovery container를 사용하세요. 추적되는 설정을 고친 뒤 컨테이너를 rebuild합니다. 일반 실행이 계속 실패하면 GitHub의 [변경 내용을 브랜치로 내보내는 경로](https://docs.github.com/en/codespaces/troubleshooting/exporting-changes-to-a-branch)를 사용하세요.
