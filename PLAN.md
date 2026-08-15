# Implementation Plan

## Phase 0 — Discovery / Scaffold
- Upstream Hubble source와 MIT license 확인
- Homebox Docker, `homebox-edge`, wildcard tunnel/Traefik 상태 확인
- 제품·보안·배포 결정을 문서화

## Phase 1 — Web UI
- Hubble shared editor/sidebar를 재사용하는 read-only React/Vite 앱
- REST 기반 파일 목록·본문·검색
- 빈 workspace와 오류 상태 처리

## Phase 2 — Backend + MCP
- public REST read API와 static frontend 제공
- 별도 MCP port, Bearer auth, Origin 검증
- Markdown 전용 path guard, hash 충돌 방지, trash, audit log

## Phase 3 — Container
- multi-stage Docker build
- 단일 app container + Docker named volume
- root filesystem read-only, dropped capabilities, healthcheck

## Phase 4 — Verification
- unit/integration/MCP tests
- production build
- container smoke와 volume persistence/host-isolation 확인

## Phase 5 — Homebox Deployment
- app compose + secret env
- `homebox-edge` 연결
- Traefik `md.yongduct.work` route
- 내부/외부/known-route regression 확인
