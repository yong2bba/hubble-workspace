# Decisions

## 2026-08-15 — Homebox + Docker named volume
**Status:** accepted

**Decision:** Mac mini가 아니라 Homebox에서 app container와 전용 named volume을 운영한다.

**Reason:** Homebox에 Docker, Traefik, wildcard Cloudflare Tunnel, 상시 운영 기반이 이미 있다.

## 2026-08-15 — Public read-only web, authenticated internal MCP
**Status:** superseded

**Decision:** 최초 배포에서는 `md.yongduct.work`를 공개 읽기 전용으로 두고 쓰기를 내부 MCP로만 허용했다.

**Reason:** Cloudflare Access 없이 공개하되 익명 사용자가 저장공간을 변경하지 못하게 하기 위한 초기 경계였다.

## 2026-08-15 — Temporary public create/update
**Status:** accepted

**Decision:** 사용자 요청에 따라 공개 Hubble UI와 REST에 Markdown 생성·수정을 허용한다. 공개 삭제·이동은 계속 차단하고, 내부 MCP의 Bearer 인증과 loopback 경계는 유지한다.

**Risk:** 인증이 없으므로 URL을 아는 누구나 문서를 생성하거나 수정할 수 있다. 개인·비공개 자료를 넣기 전 Access 또는 애플리케이션 인증을 도입해야 한다.

## 2026-08-15 — No existing content and no host mounts
**Status:** accepted

**Decision:** Artifact Garden·Mac mini·Homebox 기존 문서를 가져오지 않고 빈 named volume으로 시작한다. 호스트 bind mount를 사용하지 않는다.

## 2026-08-15 — No A2A
**Status:** accepted

**Decision:** 에이전트는 Workspace MCP를 직접 사용한다. 비동기 agent orchestration 계층은 만들지 않는다.

## 2026-08-15 — Reuse Hubble UI under MIT
**Status:** accepted

**Decision:** upstream shared `@hubble.md/editor`와 `@hubble.md/ui`를 재사용하고 저작권·MIT license를 유지한다.
