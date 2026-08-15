---
status: complete
updated: 2026-08-15
summary: "Anonymous Hubble editing and MCP 2026-07-28 are live and verified"
current_focus: none
next_step: add authentication before storing private material
blockers:
  - "Workboard audit card mutation denied by delegate-task child-context guard"
  - "AGENTS.md policy update requires separate protected-file approval"
---

# Handoff

## Last Work
- Homebox를 commit `46c0b59890b9633cf768d9d574993d2ad6153adf`로 재배포했다.
- 공개 Hubble editor에서 실제 문서를 열고 키보드로 `UI`를 입력했다. 배지가 `저장됨`으로 바뀌었고 API readback이 `Marker:UI`를 반환했다.
- 공개 REST의 생성·수정과 SHA-256 충돌 검사를 확인했다. 삭제·이동·기타 mutation은 계속 405다.
- 내부 MCP는 stable SDK v2 / protocol `2026-07-28`로 협상했고 7 tools, Bearer 401, hostile Host/Origin 403, legacy GET 405를 확인했다.
- 검증 문서는 MCP `trash_file`로 정리했고 공개 파일 목록은 다시 `[]`다.

## Current State
`md.yongduct.work`는 익명 Markdown 생성·편집·자동 저장이 가능한 상태다. 컨테이너는 healthy, node user, read-only rootfs이며 named volume만 `/workspace`에 마운트한다. MCP는 Homebox loopback에만 있다.

## Next Safe Action
개인·비공개 자료를 넣기 전에 Access 또는 애플리케이션 인증을 도입한다.

## Risk
인증이 없으므로 URL을 아는 누구나 문서를 생성하거나 수정할 수 있다. 공개 삭제·이동은 차단돼 있지만 내용 훼손 위험은 남아 있다.
