# Product Brief — Hubble Workspace

## Goal
Homebox의 격리된 Docker named volume을 사람과 에이전트가 함께 쓰는 Markdown 워크스페이스로 제공한다. 사람은 `md.yongduct.work`의 Hubble UI에서 공개 문서를 읽고, 에이전트는 인증된 내부 MCP를 통해서만 파일을 생성·수정한다.

## Target Users
- 공개 Markdown을 읽는 방문자
- Workspace MCP를 사용하는 Yongjin의 Hermes 에이전트

## Core Use Cases
- Hubble UI로 Markdown 트리 탐색·읽기·검색
- MCP로 Markdown 목록·읽기·검색·생성·수정·이동·휴지통 처리
- Homebox Docker named volume에만 파일 보존

## Non-goals
- 기존 Artifact Garden, Mac mini, Homebox 호스트 문서 가져오기
- 공개 웹 편집·업로드·삭제
- 터미널, 임의 명령, HTML App 실행
- A2A 작업 오케스트레이션
- Cloudflare Access 이외의 애플리케이션 자체 사용자 계정 체계

## Success Criteria
- 외부 `https://md.yongduct.work`가 Hubble UI를 제공한다.
- 공개 HTTP API는 Markdown 생성·수정을 허용하고, 삭제·이동은 차단한다.
- MCP는 별도 내부 포트와 Bearer token을 요구한다.
- backend만 named volume을 소유하고 경로 이탈·symlink를 차단한다.
- 빈 volume으로 시작하고 기존 작성 문서를 포함하지 않는다.
- 테스트, production build, Docker smoke, 외부 smoke가 통과한다.

## User Journeys
1. 방문자가 도메인에 접속해 공개 Markdown을 탐색한다.
2. Hermes가 MCP로 새 문서를 만들면 웹 UI 새로고침 후 표시된다.
3. Hermes가 기존 hash를 제시해 문서를 안전하게 갱신한다.
4. 삭제는 즉시 제거가 아니라 숨겨진 `.trash`로 이동한다.
