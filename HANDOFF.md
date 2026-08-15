---
status: complete
updated: 2026-08-15
summary: "Cloudflare Access-protected Hubble editing and MCP 2026-07-28 are live"
current_focus: human identity acceptance
next_step: verify intended Google login, denied identity, and Access cookie attributes
blockers:
  - "Workboard audit card mutation denied by delegate-task child-context guard"
  - "AGENTS.md policy update requires separate protected-file approval"
---

# Handoff

## Last Work
- `md.yongduct.work` exact hostname에 Cloudflare Access self-hosted application을 만들고 기존 Google IdP·exact-email reusable allow policy를 연결했다.
- 비로그인 root/API/ws/nested query가 모두 team login 302이며 redirect path/query가 보존되는 것을 확인했다. origin·sibling·unknown-host 회귀도 통과했다.
- Homebox를 commit `bf9b315fceac55b966ae423a9c93b4c5fbe45d74`로 재배포했고 UI 상태 표시는 `Access ·`로 바뀌었다.
- 공개 Hubble editor에서 실제 문서를 열고 키보드로 `UI`를 입력했다. 배지가 `저장됨`으로 바뀌었고 API readback이 `Marker:UI`를 반환했다.
- 공개 REST의 생성·수정과 SHA-256 충돌 검사를 확인했다. 삭제·이동·기타 mutation은 계속 405다.
- 내부 MCP는 stable SDK v2 / protocol `2026-07-28`로 협상했고 7 tools, Bearer 401, hostile Host/Origin 403, legacy GET 405를 확인했다.
- 검증 문서는 MCP `trash_file`로 정리했고 공개 파일 목록은 다시 `[]`다.

## Current State
`md.yongduct.work`는 Cloudflare Access Google SSO 뒤에서 Markdown 생성·편집·자동 저장이 가능하다. 컨테이너는 healthy, node user, read-only rootfs이며 named volume만 `/workspace`에 마운트한다. MCP는 Homebox loopback에만 있다.

## Next Safe Action
사용자가 실제 Google 계정으로 로그인한 뒤 앱·API 동작과 Access 쿠키 속성을 최종 확인한다.

## Authentication State
기계 검증은 완료됐다. 비로그인 root/API/ws/nested path는 Access 302이고 origin과 sibling route는 정상이다. 실제 허용 계정 로그인·비허용 계정 deny·쿠키 속성 검증은 사용자 브라우저 확인이 필요하다.
