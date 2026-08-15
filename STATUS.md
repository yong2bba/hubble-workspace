# Status

**State:** Live and verified
**URL:** https://md.yongduct.work
**Source:** https://github.com/yong2bba/hubble-workspace
**Production commit:** `46c0b59890b9633cf768d9d574993d2ad6153adf`

## Production

- Hubble UI: Cloudflare Access-authenticated Markdown create/edit/autosave
- Edge REST: Access-authenticated list/read/search/create/update
- Destructive public methods: blocked with 405
- Internal MCP: stable SDK v2, protocol `2026-07-28`, Homebox loopback only
- Container: healthy, node user, read-only rootfs, restart count 0
- Storage: named volume `homebox_hubble_workspace_data`
- Public files after smoke cleanup: `[]`

## Verification

- Server tests: 9/9 PASS
- Web/server production builds: PASS
- React Compiler audit: 3 compiled, 0 failed
- Biome: 22 files PASS
- Production dependency audit: 0 vulnerabilities
- Docker build and ephemeral volume smoke: PASS
- Live Hubble editor keyboard input: PASS
- Live autosave badge: `저장됨`
- Live API readback: typed `Marker:UI` content matched
- MCP v2 negotiation: `2026-07-28`, 7 tools
- No bearer: 401; hostile Host/Origin: 403; legacy GET: 405
- Public `/mcp`: 404; unknown Traefik host: 404

## Authentication

Cloudflare Access protects the exact hostname with Google SSO, 24-hour sessions, Instant Authentication, and the reusable exact-email allow policy. The application origin does not implement a second user login layer.
