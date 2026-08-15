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
