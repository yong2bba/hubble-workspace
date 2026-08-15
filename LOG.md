# Log

## 2026-08-15
- Confirmed Homebox Docker/Traefik foundation and unused `md.yongduct.work` route.
- Cloned Hubble upstream commit `c4235c9` and recorded MIT reuse boundary.
- Locked architecture: public read-only Hubble UI, authenticated internal MCP, empty named volume, no A2A/Access/host document mount.
- Implemented Hubble shared UI web, public REST, authenticated Streamable HTTP MCP, path guard, hash conflict control, trash, and audit log.
- Passed 7 tests, production builds, React Compiler audit (3/0), and ephemeral Docker volume smoke; removed smoke container/volume.
- Published `yong2bba/hubble-workspace`, deployed a healthy Homebox container/named volume, and installed the Traefik route for `md.yongduct.work`.
- Verified public files `[]`, public mutation 405, public MCP 404, internal official MCP client 7 tools, unauthorized 401, browser empty-state PASS, and production audit 0 vulnerabilities.
- Workboard audit card creation was blocked by the delegate-task child-context mutation guard; no policy bypass was attempted.
- User explicitly approved temporary anonymous editing. Added public Markdown create/update with SHA-256 conflict checks while destructive public methods remain blocked.
- Migrated MCP from SDK v1 / protocol 2025-06-18 to stable SDK v2 / protocol 2026-07-28 with request-scoped servers, Host/Origin validation, bearer auth, and legacy transport rejection.
- Passed 9 server tests, web/server builds, React Compiler audit (3/0), Biome (22 files), and an ephemeral Docker v2/public-edit smoke; resources were removed.
- Redeployed Homebox at commit `46c0b59890b9633cf768d9d574993d2ad6153adf`; container is healthy with node user, read-only rootfs, named-volume-only storage, and zero restarts.
- Verified live Hubble keyboard editing and autosave (`저장됨`) with exact API readback, then trashed the smoke document through MCP and restored public files to `[]`.
- Verified live MCP `2026-07-28` negotiation and 7 tools; no bearer 401, hostile Host/Origin 403, legacy GET 405, public MCP 404, known route 200, and unknown Traefik host 404.
- Added a dedicated Cloudflare Access self-hosted application for exact `md.yongduct.work`, reusing the existing Google IdP and exact-email reusable allow policy with 24-hour sessions and Instant Authentication.
- Verified unauthenticated root, API, WebSocket-shaped, and nested-query paths all redirect 302 to the team login domain with exact path/query preservation; Homebox origin remained 200, sibling route 200, and unknown host 404.
- Google SSO handoff reached the Google sign-in page. Intended-identity allow, non-allowed-identity deny, and Access cookie attributes remain human-browser acceptance steps.
