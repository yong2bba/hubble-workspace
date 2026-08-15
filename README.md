# Hubble Workspace for Homebox

`md.yongduct.work`에서 Hubble UI로 공개 Markdown을 읽고, 인증된 에이전트가 내부 MCP로만 쓰는 격리형 workspace입니다.

## Architecture

```text
Public browser
  → Cloudflare Tunnel → Traefik
  → container :3000 (Hubble UI + anonymous create/update REST)

Hermes / MCP client
  → SSH tunnel to Homebox loopback
  → container :3001 (Bearer-authenticated Streamable HTTP MCP)

container
  → Docker named volume: homebox_hubble_workspace_data
```

기존 Artifact Garden, Mac mini, Homebox 호스트 문서는 마운트하거나 가져오지 않습니다. 새 named volume에는 공개 Markdown이 없는 상태로 시작합니다.

## Packages

- `apps/workspace-web`: upstream Hubble shared UI/editor를 사용하는 editable React/Vite frontend
- `apps/workspace-server`: public REST/static server + separate authenticated MCP server
- `deploy/homebox`: Compose와 Traefik route
- `Dockerfile.workspace`: production multi-stage image

## Commands

```bash
pnpm install
pnpm test:workspace
pnpm build:workspace
docker build -f Dockerfile.workspace -t hubble-workspace:local .
```

## Public API

```text
GET /api/health
GET /api/files
GET /api/files/content?path=notes/example.md
GET /api/search?q=term
```

Public `POST /api/files` and `PUT /api/files/content` support Markdown create/update with SHA-256 conflict checks. Destructive and unknown mutation methods return 405. This temporary anonymous editing mode must not hold private material.

## MCP

Streamable HTTP endpoint: `POST /mcp` on internal port 3001.

Tools:
- `list_files`
- `read_file`
- `search_files`
- `create_file`
- `update_file`
- `move_file`
- `trash_file`

Homebox binds MCP only to `127.0.0.1:13001`. From the Mac:

```bash
ssh -N -L 13001:127.0.0.1:13001 homebox
```

Then connect an MCP client to `http://127.0.0.1:13001/mcp` with `Authorization: Bearer <MCP_API_TOKEN>`.

## Attribution

This derivative reuses Hubble.md's editor and UI packages.

- Upstream: https://github.com/bholmesdev/hubble.md
- Starting commit: `c4235c9eeae77958d966d2fe7c44ce91e5a89aca`
- License: MIT
- Copyright (c) 2026 Ben Holmes

The upstream copyright and MIT license remain in [`LICENSE`](./LICENSE).
