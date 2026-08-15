---
status: deploying
updated: 2026-08-15
summary: "Anonymous Hubble editing and MCP 2026-07-28 are locally verified; Homebox redeploy is next"
current_focus: Homebox redeploy
next_step: pull the pushed commit, rebuild, and verify the live UI/API/MCP
blockers:
  - "Workboard audit card mutation denied by delegate-task child-context guard"
  - "AGENTS.md policy update requires separate protected-file approval"
---

# Handoff

## Last Work
- 사용자 요청에 따라 Hubble editor를 `editable=true`로 전환하고 새 문서 생성과 SHA-256 충돌 검사 저장을 연결했다.
- 공개 REST에 `POST /api/files`, `PUT /api/files/content`를 추가했다. 삭제·이동·기타 mutation은 계속 405다.
- MCP를 stable SDK v2와 protocol `2026-07-28`로 마이그레이션했다. Host/Origin/Bearer 검증과 legacy transport 거부를 테스트했다.
- 서버 테스트 9/9, builds, React Compiler 3/0, Biome, Docker smoke가 통과했다.

## Current State
현재 production은 직전 read-only 버전이다. 변경은 로컬에서 검증됐으며 Homebox 재배포가 다음 단계다.

## Next Safe Action
변경 commit을 Homebox에서 pull/build/up한 뒤 외부 문서 생성·편집, 내부 MCP v2 협상과 보안 경계를 다시 검증한다.

## Needs User Decision
없음. 사용자가 임시 공개 편집을 명시적으로 승인했다.

## Risk
인증이 없으므로 URL을 아는 누구나 문서를 생성·수정할 수 있다. 개인·비공개 자료를 넣기 전 인증을 도입해야 한다.
