# Status

**State:** Update verified locally; production redeploy pending
**URL:** https://md.yongduct.work
**Source:** https://github.com/yong2bba/hubble-workspace

## Pending Production Change

- Hubble UI: anonymous Markdown create/edit/autosave
- Public REST: list/read/search/create/update
- Destructive public methods: blocked with 405
- Internal MCP: stable SDK v2, protocol `2026-07-28`

## Local Verification

- Server tests: 9/9 PASS
- Web/server production builds: PASS
- React Compiler audit: 3 compiled, 0 failed
- Biome: 22 files PASS
- Docker build and ephemeral volume smoke: PASS
- Public create/update: PASS with SHA-256 conflict control
- Public destructive method: 405
- MCP v2 negotiation: `2026-07-28`, 7 tools
- MCP GET: 405; hostile Host/Origin: 403

## Risk

Anonymous editing is a temporary accepted risk. Do not store private material before authentication is enabled.
