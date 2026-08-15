# Status

**State:** Access edge live; machine verification complete, human identity acceptance pending
**URL:** https://md.yongduct.work
**Source:** https://github.com/yong2bba/hubble-workspace
**Production commit:** `bf9b315fceac55b966ae423a9c93b4c5fbe45d74`

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
- Access application: exact `md.yongduct.work`, self-hosted, Google IdP, exact-email reusable allow policy
- Access session: 24h; Instant Authentication: enabled
- Unauthenticated root/API/ws/nested query: 302 with exact redirect path/query preservation
- Google SSO handoff: Google sign-in page reached
- Homebox origin: 200; unaffected sibling: 200; unknown host: 404
- Deployed UI badge: `Access ·`; bundle verification PASS

## Authentication

Cloudflare Access protects the exact hostname with Google SSO, 24-hour sessions, Instant Authentication, and the reusable exact-email allow policy. The application origin does not implement a second user login layer.
