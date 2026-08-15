# Status

**State:** Live and verified  
**URL:** https://md.yongduct.work  
**Source:** https://github.com/yong2bba/hubble-workspace

## Production

- Homebox container: `homebox-hubble-workspace` — healthy
- Storage: Docker named volume `homebox_hubble_workspace_data`
- Public surface: Hubble UI + read-only REST
- Internal surface: bearer-authenticated MCP Streamable HTTP on Homebox loopback only
- Public documents: 0

## Verification

- Server tests: 7/7 PASS
- Web/server production builds: PASS
- React Compiler audit: 3 compiled, 0 failed
- Docker build and ephemeral volume smoke: PASS
- Public API: health PASS, files `[]`, mutation 405
- Public MCP path: 404
- Internal MCP: official client lists 7 tools, unauthorized request 401
- Container boundary: read-only rootfs, node user, no host home, no Docker socket
- Browser visual QA: empty-state layout PASS
- Production dependency audit: 0 vulnerabilities

## Operational Note

Workboard audit-card creation was attempted but denied by the child-context mutation guard. No bypass was attempted; evidence remains in this repository and the live verification logs.
