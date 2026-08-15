---
status: complete
updated: 2026-08-15
summary: "Hubble Workspace is live and verified at md.yongduct.work"
current_focus: none
next_step: optional Hermes MCP client registration when requested
blockers:
  - "Workboard audit card mutation denied by delegate-task child-context guard"
---

# Handoff

## Last Work
- GitHub `yong2bba/hubble-workspace`에 공개 소스를 push했다.
- Homebox에 image/container/named volume을 배포하고 Traefik으로 `md.yongduct.work`를 연결했다.
- production container `healthy`, read-only rootfs, node user, host home/Docker socket 미노출을 확인했다.
- public API는 files `[]`, mutation 405, public `/mcp` 404이며 CSP가 적용됐다.
- SSH loopback tunnel에서 official MCP client로 7 tools와 files `[]`를 확인했고, 무자격 요청은 401이었다.
- 브라우저 empty-state visual QA가 PASS했다. production 의존성 audit은 0 vulnerabilities였다.

## Current State
서비스가 공개 read-only empty workspace로 운영 중이다. named volume에는 `.trash`, `.workspace` 외 공개 Markdown 문서가 없다.

## Next Safe Action
사용자가 원할 때 별도 Hermes profile에 SSH tunnel/서비스 자격을 사용한 MCP client를 등록한다.

## Needs User Decision
없음. 사용자가 배포와 도메인을 명시적으로 승인했다.

## Blockers
없음.

## Verification
- Upstream commit: `c4235c9eeae77958d966d2fe7c44ce91e5a89aca`
- Homebox Docker server: 29.7.1
- `md.yongduct.work`: HTTP 404 before deployment
