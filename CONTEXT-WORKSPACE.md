# Workspace Context

## Source
- Upstream: https://github.com/bholmesdev/hubble.md
- Frozen starting commit: `c4235c9eeae77958d966d2fe7c44ce91e5a89aca`
- License: MIT, Copyright (c) 2026 Ben Holmes

## Deployment
- Host: Homebox
- Public domain: `md.yongduct.work`
- Ingress: wildcard Cloudflare Tunnel → Traefik → container public port
- Storage: Docker named volume
- MCP: separate internal port, Bearer authenticated, not routed by Traefik

## Security Boundary
- Public routes: static UI, health, list/read/search only
- Private capability: MCP mutations
- Allowed content: Markdown files
- Denied: absolute paths, `..`, symlinks, hidden control paths, oversized files
- Deletes: `.trash` move
- Updates: expected SHA-256 required

## Glossary
- Workspace: named volume content, not Artifact Garden
- Public API: anonymous Markdown list/read/search/create/update HTTP API; destructive methods remain blocked
- MCP: authenticated agent tool API
